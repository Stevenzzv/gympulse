package com.gymsaas.service;

import com.gymsaas.domain.MembershipPlan;
import com.gymsaas.repository.MemberRepository;
import com.gymsaas.repository.MembershipPlanRepository;
import com.gymsaas.repository.SaleRepository;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.GymDtos.PlanRequest;
import com.gymsaas.web.dto.GymDtos.PlanResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlanService {

    private final GymService gymService;
    private final MembershipPlanRepository plans;
    private final MemberRepository members;
    private final SaleRepository sales;

    public PlanService(GymService gymService, MembershipPlanRepository plans,
                       MemberRepository members, SaleRepository sales) {
        this.gymService = gymService;
        this.plans = plans;
        this.members = members;
        this.sales = sales;
    }

    MembershipPlan require(Long gymId, Long planId) {
        return plans.findByIdAndGymId(planId, gymId).orElseThrow(() -> ApiException.notFound("Plan no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> list(Long ownerId, Long gymId) {
        gymService.requireOwned(ownerId, gymId);
        return plans.findByGymIdOrderByPriceAsc(gymId).stream().map(PlanResponse::from).toList();
    }

    @Transactional
    public PlanResponse create(Long ownerId, Long gymId, PlanRequest req) {
        MembershipPlan p = new MembershipPlan();
        p.setGym(gymService.requireOwned(ownerId, gymId));
        apply(p, req);
        return PlanResponse.from(plans.save(p));
    }

    @Transactional
    public PlanResponse update(Long ownerId, Long gymId, Long planId, PlanRequest req) {
        gymService.requireOwned(ownerId, gymId);
        MembershipPlan p = require(gymId, planId);
        apply(p, req);
        return PlanResponse.from(p);
    }

    @Transactional
    public void delete(Long ownerId, Long gymId, Long planId) {
        gymService.requireOwned(ownerId, gymId);
        MembershipPlan p = require(gymId, planId);
        // Keep members and sales history; they just lose the link to the removed plan.
        members.detachPlan(p.getId());
        sales.detachPlan(p.getId());
        plans.delete(p);
    }

    private static void apply(MembershipPlan p, PlanRequest req) {
        p.setName(req.name().trim());
        p.setPrice(req.price());
        p.setDurationDays(req.durationDays());
        p.setDescription(req.description());
        if (req.active() != null) p.setActive(req.active());
    }
}
