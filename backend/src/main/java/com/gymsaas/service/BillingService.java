package com.gymsaas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymsaas.config.AppProperties;
import com.gymsaas.config.AppProperties.BillingPlan;
import com.gymsaas.domain.*;
import com.gymsaas.repository.SubscriptionPaymentRepository;
import com.gymsaas.repository.UserRepository;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.BillingDtos.BillingResponse;
import com.gymsaas.web.dto.BillingDtos.PaymentResponse;
import com.gymsaas.web.dto.BillingDtos.PlanOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * SaaS subscription billing. Two ways to pay:
 * <ul>
 *   <li><b>Transfer / DeUna (Ecuador)</b>: the owner reports the payment with its reference and an optional
 *       receipt; it stays PENDING until an admin approves it (see {@link AdminService}).</li>
 *   <li><b>PayPal (international)</b>: the owner pays a plan's PayPal link and PayPal calls
 *       {@code POST /api/paypal/webhook}. The signature is verified with PayPal's API, the user is resolved
 *       by {@code custom_id} (our user id) or by the payer email, and the amount is matched to a plan.</li>
 * </ul>
 */
@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    private static final Set<String> RECEIPT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf");
    private static final Set<SubscriptionPaymentMethod> SELF_REPORTED = Set.of(
            SubscriptionPaymentMethod.TRANSFER, SubscriptionPaymentMethod.DEUNA);

    private final AppProperties props;
    private final UserRepository users;
    private final SubscriptionPaymentRepository payments;
    private final ObjectMapper mapper;
    private final RestClient http;

    public BillingService(AppProperties props, UserRepository users, SubscriptionPaymentRepository payments,
                          ObjectMapper mapper, RestClient.Builder builder) {
        this.props = props;
        this.users = users;
        this.payments = payments;
        this.mapper = mapper;
        this.http = builder.baseUrl(props.paypal().apiBase()).build();
    }

    private User user(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
    }

    private BillingPlan plan(String code) {
        return props.subscription().plan(code).orElseThrow(() -> ApiException.badRequest("Plan de suscripción no válido"));
    }

    @Transactional(readOnly = true)
    public BillingResponse billing(Long userId) {
        User u = user(userId);
        var sub = props.subscription();
        var history = payments.findByUserIdOrderByCreatedAtDesc(userId).stream().map(PaymentResponse::from).toList();
        return new BillingResponse(u.getSubscriptionStatus().name(), u.hasActiveAccess(), u.getTrialEndsAt(),
                u.getSubscriptionEndsAt(), sub.currency(), sub.plans().stream().map(PlanOption::from).toList(),
                props.manualPayment(), props.paypal().simulationEnabled(),
                history.stream().anyMatch(p -> p.status() == PaymentStatus.PENDING), history);
    }

    /** Owner reports a transfer / DeUna payment; an admin reviews it. */
    @Transactional
    public PaymentResponse reportManualPayment(Long userId, String planCode, SubscriptionPaymentMethod method,
                                               String reference, String note, MultipartFile receipt) {
        if (method == null || !SELF_REPORTED.contains(method)) {
            throw ApiException.badRequest("Método de pago no válido");
        }
        BillingPlan plan = plan(planCode);
        boolean hasReceipt = receipt != null && !receipt.isEmpty();
        if ((reference == null || reference.isBlank()) && !hasReceipt) {
            throw ApiException.badRequest("Ingresa el número de comprobante o sube una foto del comprobante");
        }
        if (payments.existsByUserIdAndStatus(userId, PaymentStatus.PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya tienes un pago en revisión. Te avisaremos al aprobarlo.");
        }

        SubscriptionPayment p = new SubscriptionPayment();
        p.setUser(user(userId));
        p.setMethod(method);
        p.setStatus(PaymentStatus.PENDING);
        p.setPlanCode(plan.code());
        p.setMonths(plan.months());
        p.setAmount(plan.price());
        p.setCurrency(props.subscription().currency());
        p.setReference(blankToNull(reference));
        p.setPayerNote(blankToNull(note));
        if (hasReceipt) p.setReceipt(toReceipt(receipt));
        return PaymentResponse.from(payments.save(p));
    }

    @Transactional(readOnly = true)
    public PaymentReceipt receipt(Long requesterId, boolean isAdmin, Long paymentId) {
        SubscriptionPayment p = payments.findById(paymentId)
                .filter(x -> isAdmin || x.getUser().getId().equals(requesterId))
                .orElseThrow(() -> ApiException.notFound("Pago no encontrado"));
        if (p.getReceipt() == null) throw ApiException.notFound("Este pago no tiene comprobante");
        PaymentReceipt r = p.getReceipt();
        r.getData(); // load inside the transaction
        return r;
    }

    /** Dev/test helper: behaves as if a monthly payment was received and approved. */
    @Transactional
    public BillingResponse simulatePayment(Long userId) {
        if (!props.paypal().simulationEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "La simulación de pagos está desactivada");
        }
        BillingPlan base = props.subscription().basePlan();
        SubscriptionPayment p = new SubscriptionPayment();
        p.setUser(user(userId));
        p.setMethod(SubscriptionPaymentMethod.SIMULATED);
        p.setPlanCode(base.code());
        p.setMonths(base.months());
        p.setAmount(base.price());
        p.setCurrency(props.subscription().currency());
        p.setExternalId("SIM-" + UUID.randomUUID());
        approve(p, null);
        payments.save(p);
        return billing(userId);
    }

    /** Marks a payment approved and extends its owner's access by the payment's months. */
    void approve(SubscriptionPayment p, String adminNote) {
        p.setStatus(PaymentStatus.APPROVED);
        p.setReviewedAt(Instant.now());
        if (adminNote != null) p.setAdminNote(adminNote);
        extendMonths(p.getUser(), p.getMonths());
    }

    void extendMonths(User u, int months) {
        Instant base = Instant.now();
        if (u.getSubscriptionEndsAt() != null && u.getSubscriptionEndsAt().isAfter(base)) base = u.getSubscriptionEndsAt();
        if (u.getSubscriptionStatus() == SubscriptionStatus.TRIAL && u.getTrialEndsAt() != null
                && u.getTrialEndsAt().isAfter(base)) base = u.getTrialEndsAt(); // don't eat the remaining trial
        u.setSubscriptionEndsAt(base.atZone(ZoneOffset.UTC).plusMonths(months).toInstant());
        u.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
    }

    // ------------------------------------------------------------------ PayPal

    @Transactional
    public void handleWebhook(String rawBody, Map<String, String> headers) {
        JsonNode event;
        try {
            event = mapper.readTree(rawBody);
        } catch (Exception e) {
            throw ApiException.badRequest("Invalid JSON");
        }
        if (!verifySignature(event, headers)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid PayPal webhook signature");
        }

        String type = event.path("event_type").asText();
        JsonNode r = event.path("resource");
        String externalId;
        BigDecimal amount;
        String currency;
        String customId;
        switch (type) {
            case "PAYMENT.CAPTURE.COMPLETED" -> {
                externalId = r.path("id").asText();
                amount = new BigDecimal(r.path("amount").path("value").asText("0"));
                currency = r.path("amount").path("currency_code").asText();
                customId = r.path("custom_id").asText(null);
            }
            case "PAYMENT.SALE.COMPLETED" -> {
                externalId = r.path("id").asText();
                amount = new BigDecimal(r.path("amount").path("total").asText("0"));
                currency = r.path("amount").path("currency").asText();
                customId = r.path("custom").asText(r.path("custom_id").asText(null));
            }
            default -> {
                log.info("Ignoring PayPal event {}", type);
                return;
            }
        }
        if (externalId.isBlank() || payments.existsByExternalId(externalId)) {
            return; // PayPal re-delivers events; process each payment once
        }

        String payerEmail = findPayerEmail(r).orElse(null);
        Optional<User> user = resolveUser(customId, payerEmail);
        if (user.isEmpty()) {
            log.warn("PayPal payment {} ({} {}) could not be matched to a user (custom_id={}, payer={})",
                    externalId, amount, currency, customId, payerEmail);
            return;
        }

        SubscriptionPayment p = new SubscriptionPayment();
        p.setUser(user.get());
        p.setMethod(SubscriptionPaymentMethod.PAYPAL);
        p.setExternalId(externalId);
        p.setAmount(amount);
        p.setCurrency(currency);
        p.setPayerEmail(payerEmail);

        Optional<BillingPlan> plan = currency.equalsIgnoreCase(props.subscription().currency())
                ? matchPlan(amount) : Optional.empty();
        if (plan.isPresent()) {
            p.setPlanCode(plan.get().code());
            p.setMonths(plan.get().months());
            approve(p, null);
        } else {
            // Unexpected amount: keep it for an admin to decide instead of guessing.
            p.setStatus(PaymentStatus.PENDING);
            p.setMonths(monthsForAmount(amount));
            p.setAdminNote("Monto de PayPal no coincide con ningún plan: revisar");
            log.warn("PayPal payment {} of {} {} matches no plan; left pending", externalId, amount, currency);
        }
        payments.save(p);
    }

    private Optional<BillingPlan> matchPlan(BigDecimal amount) {
        return props.subscription().plans().stream().filter(pl -> pl.price().compareTo(amount) == 0).findFirst();
    }

    private int monthsForAmount(BigDecimal amount) {
        BillingPlan base = props.subscription().basePlan();
        int m = amount.divide(base.price(), 0, RoundingMode.DOWN).intValue() * base.months();
        return Math.max(m, 1);
    }

    private Optional<User> resolveUser(String customId, String payerEmail) {
        if (customId != null && customId.matches("\\d+")) {
            Optional<User> byId = users.findById(Long.parseLong(customId));
            if (byId.isPresent()) return byId;
        }
        return payerEmail == null ? Optional.empty() : users.findByEmailIgnoreCase(payerEmail);
    }

    /** Capture events don't carry the payer; look it up on the related order. */
    private Optional<String> findPayerEmail(JsonNode resource) {
        String direct = resource.path("payer").path("email_address").asText(
                resource.path("payer").path("payer_info").path("email").asText(""));
        if (!direct.isBlank()) return Optional.of(direct);

        String orderId = resource.path("supplementary_data").path("related_ids").path("order_id").asText("");
        if (orderId.isBlank() || !props.paypal().canVerifyWebhooks()) return Optional.empty();
        try {
            JsonNode order = http.get().uri("/v2/checkout/orders/{id}", orderId)
                    .header("Authorization", "Bearer " + accessToken())
                    .retrieve().body(JsonNode.class);
            String email = order == null ? "" : order.path("payer").path("email_address").asText("");
            return email.isBlank() ? Optional.empty() : Optional.of(email);
        } catch (Exception e) {
            log.warn("Could not fetch PayPal order {}: {}", orderId, e.getMessage());
            return Optional.empty();
        }
    }

    private boolean verifySignature(JsonNode event, Map<String, String> h) {
        var pp = props.paypal();
        if (!pp.canVerifyWebhooks()) {
            // Without credentials we cannot prove the request came from PayPal: accept only in simulation (dev) mode.
            log.warn("PayPal webhook received but PAYPAL_CLIENT_ID/SECRET/WEBHOOK_ID are not configured");
            return pp.simulationEnabled();
        }
        try {
            Map<String, Object> body = Map.of(
                    "auth_algo", h.getOrDefault("paypal-auth-algo", ""),
                    "cert_url", h.getOrDefault("paypal-cert-url", ""),
                    "transmission_id", h.getOrDefault("paypal-transmission-id", ""),
                    "transmission_sig", h.getOrDefault("paypal-transmission-sig", ""),
                    "transmission_time", h.getOrDefault("paypal-transmission-time", ""),
                    "webhook_id", pp.webhookId(),
                    "webhook_event", event);
            JsonNode res = http.post().uri("/v1/notifications/verify-webhook-signature")
                    .header("Authorization", "Bearer " + accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve().body(JsonNode.class);
            return res != null && "SUCCESS".equals(res.path("verification_status").asText());
        } catch (Exception e) {
            log.error("PayPal webhook verification failed", e);
            return false;
        }
    }

    private String accessToken() {
        var pp = props.paypal();
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        JsonNode res = http.post().uri("/v1/oauth2/token")
                .headers(h -> h.setBasicAuth(pp.clientId(), pp.clientSecret()))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve().body(JsonNode.class);
        return res.path("access_token").asText();
    }

    // ------------------------------------------------------------------ helpers

    private static PaymentReceipt toReceipt(MultipartFile file) {
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!RECEIPT_TYPES.contains(type)) {
            throw ApiException.badRequest("El comprobante debe ser una imagen (JPG, PNG, WEBP) o un PDF");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw ApiException.badRequest("El comprobante no puede pesar más de 5 MB");
        }
        try {
            PaymentReceipt r = new PaymentReceipt();
            r.setContentType(type);
            r.setFilename(file.getOriginalFilename());
            r.setData(file.getBytes());
            return r;
        } catch (IOException e) {
            throw ApiException.badRequest("No se pudo leer el comprobante");
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
