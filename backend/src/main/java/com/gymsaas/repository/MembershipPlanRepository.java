package com.gymsaas.repository;

import com.gymsaas.domain.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findByGymIdOrderByPriceAsc(Long gymId);
    Optional<MembershipPlan> findByIdAndGymId(Long id, Long gymId);

    @Modifying
    @Query("delete from MembershipPlan p where p.gym.id = :gymId")
    void deleteAllByGym(@Param("gymId") Long gymId);
}
