package com.gymsaas.service;

import com.gymsaas.domain.Gym;
import com.gymsaas.repository.*;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.GymDtos.GymRequest;
import com.gymsaas.web.dto.GymDtos.GymResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GymService {

    private final GymRepository gyms;
    private final UserRepository users;
    private final MemberRepository members;
    private final MembershipPlanRepository plans;
    private final SaleRepository sales;

    public GymService(GymRepository gyms, UserRepository users, MemberRepository members,
                      MembershipPlanRepository plans, SaleRepository sales) {
        this.gyms = gyms;
        this.users = users;
        this.members = members;
        this.plans = plans;
        this.sales = sales;
    }

    /** Loads a gym only if it belongs to the given owner — the tenant boundary of the whole app. */
    public Gym requireOwned(Long ownerId, Long gymId) {
        return gyms.findByIdAndOwnerId(gymId, ownerId).orElseThrow(() -> ApiException.notFound("Gimnasio no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<GymResponse> list(Long ownerId) {
        return gyms.findByOwnerIdOrderByNameAsc(ownerId).stream().map(GymResponse::from).toList();
    }

    @Transactional
    public GymResponse create(Long ownerId, GymRequest req) {
        Gym g = new Gym();
        g.setOwner(users.getReferenceById(ownerId));
        apply(g, req);
        return GymResponse.from(gyms.save(g));
    }

    @Transactional
    public GymResponse update(Long ownerId, Long gymId, GymRequest req) {
        Gym g = requireOwned(ownerId, gymId);
        apply(g, req);
        return GymResponse.from(g);
    }

    @Transactional
    public void delete(Long ownerId, Long gymId) {
        Gym g = requireOwned(ownerId, gymId);
        sales.deleteAllByGym(g.getId());
        members.deleteAllByGym(g.getId());
        plans.deleteAllByGym(g.getId());
        gyms.delete(g);
    }

    private static void apply(Gym g, GymRequest req) {
        g.setName(req.name().trim());
        g.setAddress(req.address());
        g.setPhone(req.phone());
    }
}
