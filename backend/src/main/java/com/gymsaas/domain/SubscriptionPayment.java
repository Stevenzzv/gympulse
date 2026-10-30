package com.gymsaas.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * A payment of the SaaS subscription itself (gym owner -> us).
 * PayPal payments arrive APPROVED through the webhook; transfers and DeUna payments are reported
 * by the owner as PENDING and approved or rejected by an admin.
 */
@Entity
@Table(name = "subscription_payments")
public class SubscriptionPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionPaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    private String planCode;

    /** Months of access this payment grants once approved. */
    @Column(nullable = false)
    private int months;

    /** PayPal capture/sale id; unique so a re-delivered webhook is processed once. */
    @Column(unique = true)
    private String externalId;

    /** Bank / DeUna transaction number typed by the owner. */
    private String reference;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    private String currency;
    private String payerEmail;

    @Column(length = 1000)
    private String payerNote;

    @Column(length = 1000)
    private String adminNote;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "receipt_id")
    private PaymentReceipt receipt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant reviewedAt;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public SubscriptionPaymentMethod getMethod() { return method; }
    public void setMethod(SubscriptionPaymentMethod method) { this.method = method; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }
    public int getMonths() { return months; }
    public void setMonths(int months) { this.months = months; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getPayerEmail() { return payerEmail; }
    public void setPayerEmail(String payerEmail) { this.payerEmail = payerEmail; }
    public String getPayerNote() { return payerNote; }
    public void setPayerNote(String payerNote) { this.payerNote = payerNote; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public PaymentReceipt getReceipt() { return receipt; }
    public void setReceipt(PaymentReceipt receipt) { this.receipt = receipt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
}
