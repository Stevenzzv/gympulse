package com.gymsaas.service;

import com.gymsaas.domain.*;
import com.gymsaas.repository.GymRepository;
import com.gymsaas.repository.SubscriptionPaymentRepository;
import com.gymsaas.repository.UserRepository;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.BillingDtos.*;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** What the SaaS operator does: review transfer / DeUna payments and manage customer subscriptions. */
@Service
public class AdminService {

    private final SubscriptionPaymentRepository payments;
    private final UserRepository users;
    private final GymRepository gyms;
    private final BillingService billing;

    public AdminService(SubscriptionPaymentRepository payments, UserRepository users, GymRepository gyms,
                        BillingService billing) {
        this.payments = payments;
        this.users = users;
        this.gyms = gyms;
        this.billing = billing;
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentResponse> payments(PaymentStatus status) {
        var list = status == null ? payments.findTop100ByOrderByCreatedAtDesc()
                : payments.findByStatusOrderByCreatedAtAsc(status);
        return list.stream()
                .map(p -> new AdminPaymentResponse(PaymentResponse.from(p), UserSummary.from(p.getUser())))
                .toList();
    }

    @Transactional
    public AdminPaymentResponse approve(Long paymentId, ReviewRequest req) {
        SubscriptionPayment p = pending(paymentId);
        if (req != null && req.months() != null) p.setMonths(req.months());
        billing.approve(p, req == null ? null : blankToNull(req.adminNote()));
        return new AdminPaymentResponse(PaymentResponse.from(p), UserSummary.from(p.getUser()));
    }

    @Transactional
    public AdminPaymentResponse reject(Long paymentId, ReviewRequest req) {
        SubscriptionPayment p = pending(paymentId);
        String note = req == null ? null : blankToNull(req.adminNote());
        if (note == null) throw ApiException.badRequest("Indica el motivo del rechazo para que el cliente lo vea");
        p.setStatus(PaymentStatus.REJECTED);
        p.setAdminNote(note);
        p.setReviewedAt(Instant.now());
        return new AdminPaymentResponse(PaymentResponse.from(p), UserSummary.from(p.getUser()));
    }

    /** Registers a payment received outside the app and extends the customer's access. */
    @Transactional
    public PaymentResponse activate(Long userId, ManualActivationRequest req) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        SubscriptionPayment p = new SubscriptionPayment();
        p.setUser(u);
        p.setMethod(req.method());
        p.setMonths(req.months());
        p.setAmount(req.amount());
        p.setCurrency("USD");
        p.setReference(blankToNull(req.reference()));
        billing.approve(p, blankToNull(req.adminNote()));
        return PaymentResponse.from(payments.save(p));
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> users() {
        Map<Long, Long> gymCount = new HashMap<>();
        gyms.countByOwner().forEach(r -> gymCount.put((Long) r[0], (Long) r[1]));
        Map<Long, Instant> lastPayment = new HashMap<>();
        payments.lastApprovedPaymentByUser().forEach(r -> lastPayment.put((Long) r[0], (Instant) r[1]));

        return users.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(u -> new AdminUserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(),
                        u.getRole().name(), displayStatus(u), u.hasActiveAccess(), accessEndsAt(u),
                        u.getCreatedAt(), gymCount.getOrDefault(u.getId(), 0L), lastPayment.get(u.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminSummary summary() {
        Instant now = Instant.now();
        Instant in7 = now.plus(Duration.ofDays(7));
        List<User> owners = users.findAll().stream().filter(u -> u.getRole() == Role.OWNER).toList();
        long active = owners.stream().filter(u -> u.hasActiveAccess() && u.getSubscriptionStatus() == SubscriptionStatus.ACTIVE).count();
        long trial = owners.stream().filter(u -> u.hasActiveAccess() && u.getSubscriptionStatus() == SubscriptionStatus.TRIAL).count();
        long expiring = owners.stream().filter(User::hasActiveAccess)
                .filter(u -> accessEndsAt(u) != null && accessEndsAt(u).isBefore(in7)).count();
        BigDecimal revenue = payments.approvedRevenueByMethodSince(now.minus(Duration.ofDays(30))).stream()
                .filter(r -> r[0] != SubscriptionPaymentMethod.SIMULATED)
                .map(r -> (BigDecimal) r[1]).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AdminSummary(payments.countByStatus(PaymentStatus.PENDING), owners.size(), active, trial,
                expiring, revenue);
    }

    private SubscriptionPayment pending(Long paymentId) {
        SubscriptionPayment p = payments.findById(paymentId).orElseThrow(() -> ApiException.notFound("Pago no encontrado"));
        if (p.getStatus() != PaymentStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Este pago ya fue revisado");
        }
        return p;
    }

    private static Instant accessEndsAt(User u) {
        return u.getSubscriptionStatus() == SubscriptionStatus.TRIAL ? u.getTrialEndsAt() : u.getSubscriptionEndsAt();
    }

    private static String displayStatus(User u) {
        return u.hasActiveAccess() || u.getRole() == Role.ADMIN ? u.getSubscriptionStatus().name() : "EXPIRED";
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
