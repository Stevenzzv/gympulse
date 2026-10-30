package com.gymsaas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Subscription subscription, Paypal paypal,
                            ManualPayment manualPayment, List<String> adminEmails, boolean seedDemo) {

    public record Jwt(String secret, long expirationMinutes) {}

    public record Cors(List<String> allowedOrigins) {}

    /** A subscription option sold to gym owners, e.g. monthly / quarterly / yearly. */
    public record BillingPlan(String code, String name, int months, BigDecimal price, String paypalLink) {
        public boolean hasPaypalLink() {
            return paypalLink != null && !paypalLink.isBlank();
        }
    }

    public record Subscription(int trialDays, String currency, List<BillingPlan> plans) {
        public Optional<BillingPlan> plan(String code) {
            return plans.stream().filter(p -> p.code().equalsIgnoreCase(code)).findFirst();
        }

        /** Shortest plan; its price is the per-month reference for PayPal amounts that match no plan. */
        public BillingPlan basePlan() {
            return plans.stream().min(Comparator.comparingInt(BillingPlan::months)).orElseThrow();
        }
    }

    public record Paypal(String mode, String clientId, String clientSecret, String webhookId,
                         boolean simulationEnabled) {
        public String apiBase() {
            return "live".equalsIgnoreCase(mode) ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
        }

        public boolean canVerifyWebhooks() {
            return notBlank(clientId) && notBlank(clientSecret) && notBlank(webhookId);
        }
    }

    /** Where Ecuadorian customers send transfers / DeUna payments. Blank fields are hidden in the UI. */
    public record ManualPayment(String bankName, String accountType, String accountNumber, String accountHolder,
                                String holderId, String deunaPhone, String deunaQrUrl, String whatsapp,
                                String contactEmail) {}

    public boolean isAdminEmail(String email) {
        return adminEmails != null && adminEmails.stream()
                .anyMatch(a -> notBlank(a) && a.trim().equalsIgnoreCase(email));
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
