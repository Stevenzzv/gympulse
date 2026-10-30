package com.gymsaas.web.controller;

import com.gymsaas.config.AppProperties;
import com.gymsaas.domain.PaymentReceipt;
import com.gymsaas.domain.SubscriptionPaymentMethod;
import com.gymsaas.security.AuthUser;
import com.gymsaas.service.BillingService;
import com.gymsaas.web.dto.BillingDtos.BillingResponse;
import com.gymsaas.web.dto.BillingDtos.PaymentResponse;
import com.gymsaas.web.dto.BillingDtos.PlanOption;
import com.gymsaas.web.dto.BillingDtos.PublicPricing;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
public class BillingController {

    private final BillingService billing;
    private final AppProperties props;

    public BillingController(BillingService billing, AppProperties props) {
        this.billing = billing;
        this.props = props;
    }

    @GetMapping("/api/public/pricing")
    public PublicPricing pricing() {
        var s = props.subscription();
        return new PublicPricing(s.currency(), s.trialDays(), s.plans().stream().map(PlanOption::from).toList());
    }

    @GetMapping("/api/billing")
    public BillingResponse billing(@AuthenticationPrincipal AuthUser me) {
        return billing.billing(me.id());
    }

    @PostMapping(path = "/api/billing/manual-payments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse reportPayment(@AuthenticationPrincipal AuthUser me,
                                         @RequestParam String planCode,
                                         @RequestParam SubscriptionPaymentMethod method,
                                         @RequestParam(required = false) String reference,
                                         @RequestParam(required = false) String note,
                                         @RequestPart(required = false) MultipartFile receipt) {
        return billing.reportManualPayment(me.id(), planCode, method, reference, note, receipt);
    }

    @GetMapping("/api/billing/payments/{paymentId}/receipt")
    public ResponseEntity<byte[]> ownReceipt(@AuthenticationPrincipal AuthUser me, @PathVariable Long paymentId) {
        return receiptResponse(billing.receipt(me.id(), false, paymentId));
    }

    @GetMapping("/api/admin/payments/{paymentId}/receipt")
    public ResponseEntity<byte[]> adminReceipt(@AuthenticationPrincipal AuthUser me, @PathVariable Long paymentId) {
        return receiptResponse(billing.receipt(me.id(), true, paymentId));
    }

    @PostMapping("/api/billing/simulate")
    public BillingResponse simulate(@AuthenticationPrincipal AuthUser me) {
        return billing.simulatePayment(me.id());
    }

    @PostMapping("/api/paypal/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String body, @RequestHeader HttpHeaders headers) {
        Map<String, String> h = new HashMap<>();
        headers.forEach((k, v) -> h.put(k.toLowerCase(), v.isEmpty() ? "" : v.get(0)));
        billing.handleWebhook(body, h);
        return ResponseEntity.ok().build();
    }

    private static ResponseEntity<byte[]> receiptResponse(PaymentReceipt r) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(r.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(r.getFilename() == null ? "comprobante" : r.getFilename()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(r.getData());
    }
}
