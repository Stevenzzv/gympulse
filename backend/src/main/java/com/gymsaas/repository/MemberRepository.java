package com.gymsaas.repository;

import com.gymsaas.domain.Member;
import com.gymsaas.domain.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    @EntityGraph(attributePaths = "plan")
    @Query("""
            select m from Member m
            where m.gym.id = :gymId
              and (:status is null or m.status = :status)
              and (:q = '' or lower(concat(m.firstName, ' ', m.lastName)) like lower(concat('%', :q, '%'))
                   or lower(coalesce(m.email, '')) like lower(concat('%', :q, '%'))
                   or coalesce(m.phone, '') like concat('%', :q, '%')
                   or coalesce(m.documentId, '') like concat('%', :q, '%'))
            """)
    Page<Member> search(@Param("gymId") Long gymId, @Param("q") String q,
                        @Param("status") MemberStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "plan")
    Optional<Member> findByIdAndGymId(Long id, Long gymId);

    long countByGymId(Long gymId);

    long countByGymIdAndStatus(Long gymId, MemberStatus status);

    @Query("select count(m) from Member m where m.gym.id = :gymId and m.status = com.gymsaas.domain.MemberStatus.ACTIVE and m.membershipEndsAt >= :today")
    long countWithValidMembership(@Param("gymId") Long gymId, @Param("today") LocalDate today);

    @Query("select count(m) from Member m where m.gym.id = :gymId and m.status = com.gymsaas.domain.MemberStatus.ACTIVE and m.membershipEndsAt between :from and :to")
    long countExpiringBetween(@Param("gymId") Long gymId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select m.joinedAt from Member m where m.gym.id = :gymId and m.joinedAt >= :from")
    List<LocalDate> joinDatesSince(@Param("gymId") Long gymId, @Param("from") LocalDate from);

    @Modifying
    @Query("update Member m set m.plan = null where m.plan.id = :planId")
    void detachPlan(@Param("planId") Long planId);

    @Modifying
    @Query("delete from Member m where m.gym.id = :gymId")
    void deleteAllByGym(@Param("gymId") Long gymId);
}
