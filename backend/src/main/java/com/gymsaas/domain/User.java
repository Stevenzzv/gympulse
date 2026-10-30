package com.gymsaas.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "app_users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    /** WhatsApp / phone, used to remind owners about renewals. */
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.OWNER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIAL;

    private Instant trialEndsAt;
    private Instant subscriptionEndsAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** Trial or paid period still running. */
    public boolean hasActiveAccess() {
        Instant now = Instant.now();
        return switch (subscriptionStatus) {
            case TRIAL -> trialEndsAt != null && trialEndsAt.isAfter(now);
            case ACTIVE -> subscriptionEndsAt != null && subscriptionEndsAt.isAfter(now);
            case EXPIRED -> false;
        } || role == Role.ADMIN;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus s) { this.subscriptionStatus = s; }
    public Instant getTrialEndsAt() { return trialEndsAt; }
    public void setTrialEndsAt(Instant trialEndsAt) { this.trialEndsAt = trialEndsAt; }
    public Instant getSubscriptionEndsAt() { return subscriptionEndsAt; }
    public void setSubscriptionEndsAt(Instant subscriptionEndsAt) { this.subscriptionEndsAt = subscriptionEndsAt; }
    public Instant getCreatedAt() { return createdAt; }
}
