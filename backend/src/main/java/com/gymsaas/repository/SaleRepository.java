package com.gymsaas.repository;

import com.gymsaas.domain.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @EntityGraph(attributePaths = {"member", "plan"})
    @Query("select s from Sale s where s.gym.id = :gymId and s.soldAt >= :from and s.soldAt < :to")
    Page<Sale> findInRange(@Param("gymId") Long gymId, @Param("from") LocalDateTime from,
                           @Param("to") LocalDateTime to, Pageable pageable);

    Optional<Sale> findByIdAndGymId(Long id, Long gymId);

    @Query("select coalesce(sum(s.amount), 0) from Sale s where s.gym.id = :gymId and s.soldAt >= :from and s.soldAt < :to")
    BigDecimal sumInRange(@Param("gymId") Long gymId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select count(s) from Sale s where s.gym.id = :gymId and s.soldAt >= :from and s.soldAt < :to")
    long countInRange(@Param("gymId") Long gymId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select coalesce(sum(s.amount), 0) from Sale s where s.gym.id = :gymId")
    BigDecimal sumAll(@Param("gymId") Long gymId);

    /** Rows of [soldAt, amount] used for the monthly series. */
    @Query("select s.soldAt, s.amount from Sale s where s.gym.id = :gymId and s.soldAt >= :from")
    List<Object[]> amountsSince(@Param("gymId") Long gymId, @Param("from") LocalDateTime from);

    /** Rows of [concept-or-plan, sum, count]. */
    @Query("""
            select coalesce(p.name, s.concept), sum(s.amount), count(s)
            from Sale s left join s.plan p
            where s.gym.id = :gymId and s.soldAt >= :from
            group by coalesce(p.name, s.concept)
            order by sum(s.amount) desc
            """)
    List<Object[]> revenueByConcept(@Param("gymId") Long gymId, @Param("from") LocalDateTime from);

    /** Rows of [paymentMethod, sum, count]. */
    @Query("""
            select s.paymentMethod, sum(s.amount), count(s)
            from Sale s
            where s.gym.id = :gymId and s.soldAt >= :from
            group by s.paymentMethod
            """)
    List<Object[]> revenueByPaymentMethod(@Param("gymId") Long gymId, @Param("from") LocalDateTime from);

    @Modifying
    @Query("update Sale s set s.member = null where s.member.id = :memberId")
    void detachMember(@Param("memberId") Long memberId);

    @Modifying
    @Query("update Sale s set s.plan = null where s.plan.id = :planId")
    void detachPlan(@Param("planId") Long planId);

    @Modifying
    @Query("delete from Sale s where s.gym.id = :gymId")
    void deleteAllByGym(@Param("gymId") Long gymId);
}
