package com.gymsaas.web.dto;

import com.gymsaas.config.AppProperties.BillingPlan;
import com.gymsaas.config.AppProperties.ManualPayment;
import com.gymsaas.domain.PaymentStatus;
import com.gymsaas.domain.SubscriptionPayment;
import com.gymsaas.domain.SubscriptionPaymentMethod;
import com.gymsaas.domain.User;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class BillingDtos {
    private BillingDtos() {}

    public record PlanOption(String code, String name, int months, BigDecimal price, String paypalLink) {
        public static PlanOption from(BillingPlan p) {
            return new PlanOption(p.code(), p.name(), p.months(), p.price(), p.hasPaypalLink() ? p.paypalLink() : null);
        }
    }

    public record PaymentResponse(Long id, SubscriptionPaymentMethod method, PaymentStatus status, String planCode,
                                  int months, BigDecimal amount, String currency, String reference,
                                  String payerNote, String adminNote, boolean hasReceipt,
                                  Instant createdAt, Instant reviewedAt) {
        public static PaymentResponse from(SubscriptionPayment p) {
            return new PaymentResponse(p.getId(), p.getMethod(), p.getStatus(), p.getPlanCode(), p.getMonths(),
                    p.getAmount(), p.getCurrency(), p.getReference() != null ? p.getReference() : p.getExternalId(),
                    p.getPayerNote(), p.getAdminNote(), p.getReceipt() != null, p.getCreatedAt(), p.getReviewedAt());
        }
    }

    public record BillingResponse(String subscriptionStatus, boolean hasActiveAccess, Instant trialEndsAt,
                                  Instant subscriptionEndsAt, String currency, List<PlanOption> plans,
                                  ManualPayment manualPayment, boolean simulationEnabled,
                                  boolean hasPendingPayment, List<PaymentResponse> payments) {}

    public record PublicPricing(String currency, int trialDays, List<PlanOption> plans) {}

    // ---- Admin
    public record UserSummary(Long id, String fullName, String email, String phone) {
        public static UserSummary from(User u) {
            return new UserSummary(u.getId(), u.getFullName(), u.getEmail(), u.getPhone());
        }
    }

    public record AdminPaymentResponse(PaymentResponse payment, UserSummary user) {}

    public record AdminUserResponse(Long id, String fullName, String email, String phone, String role,
                                    String subscriptionStatus, boolean hasActiveAccess, Instant accessEndsAt,
                                    Instant createdAt, long gymCount, Instant lastPaymentAt) {}

    public record ReviewRequest(@Min(1) @Max(36) Integer months, @Size(max = 1000) String adminNote) {}

    /** Admin registers a payment received outside the app (cash, transfer seen in the bank...). */
    public record ManualActivationRequest(@NotNull @Min(1) @Max(36) Integer months,
                                          @NotNull SubscriptionPaymentMethod method,
                                          @DecimalMin("0.00") BigDecimal amount,
                                          @Size(max = 120) String reference,
                                          @Size(max = 1000) String adminNote) {}

    public record AdminSummary(long pendingPayments, long totalCustomers, long activeCustomers,
                               long trialCustomers, long expiringIn7Days, BigDecimal revenueLast30Days) {}
}
