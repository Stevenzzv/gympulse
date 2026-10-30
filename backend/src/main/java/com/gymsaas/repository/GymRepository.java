package com.gymsaas.repository;

import com.gymsaas.domain.Gym;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GymRepository extends JpaRepository<Gym, Long> {
    List<Gym> findByOwnerIdOrderByNameAsc(Long ownerId);
    Optional<Gym> findByIdAndOwnerId(Long id, Long ownerId);

    /** Rows of [ownerId, gym count]. */
    @Query("select g.owner.id, count(g) from Gym g group by g.owner.id")
    List<Object[]> countByOwner();
}
