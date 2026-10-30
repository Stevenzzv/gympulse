package com.gymsaas.repository;

import com.gymsaas.domain.PaymentStatus;
import com.gymsaas.domain.SubscriptionPayment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, Long> {
    boolean existsByExternalId(String externalId);

    boolean existsByUserIdAndStatus(Long userId, PaymentStatus status);

    List<SubscriptionPayment> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    List<SubscriptionPayment> findByStatusOrderByCreatedAtAsc(PaymentStatus status);

    @EntityGraph(attributePaths = "user")
    List<SubscriptionPayment> findTop100ByOrderByCreatedAtDesc();

    long countByStatus(PaymentStatus status);

    /** Rows of [userId, last approved payment date]. */
    @Query("select p.user.id, max(p.createdAt) from SubscriptionPayment p where p.status = com.gymsaas.domain.PaymentStatus.APPROVED group by p.user.id")
    List<Object[]> lastApprovedPaymentByUser();

    /** Rows of [method, sum] of approved payments since a date, for the admin revenue summary. */
    @Query("select p.method, coalesce(sum(p.amount), 0) from SubscriptionPayment p where p.status = com.gymsaas.domain.PaymentStatus.APPROVED and p.createdAt >= :from group by p.method")
    List<Object[]> approvedRevenueByMethodSince(@Param("from") Instant from);
}
