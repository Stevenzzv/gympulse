package com.gymsaas.service;

import com.gymsaas.domain.*;
import com.gymsaas.repository.SaleRepository;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.GymDtos.SaleRequest;
import com.gymsaas.web.dto.GymDtos.SaleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class SaleService {

    private final GymService gymService;
    private final PlanService planService;
    private final MemberService memberService;
    private final SaleRepository sales;

    public SaleService(GymService gymService, PlanService planService,
                       MemberService memberService, SaleRepository sales) {
        this.gymService = gymService;
        this.planService = planService;
        this.memberService = memberService;
        this.sales = sales;
    }

    @Transactional(readOnly = true)
    public Page<SaleResponse> list(Long ownerId, Long gymId, LocalDate from, LocalDate to, int page, int size) {
        gymService.requireOwned(ownerId, gymId);
        LocalDateTime start = (from == null ? LocalDate.of(1970, 1, 1) : from).atStartOfDay();
        LocalDateTime end = (to == null ? LocalDate.now().plusYears(100) : to).plusDays(1).atStartOfDay();
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "soldAt"));
        return sales.findInRange(gymId, start, end, pageable).map(SaleResponse::from);
    }

    /**
     * Registers a sale. When a plan is sold to a member, the member gets that plan and their
     * membership is extended by the plan duration (from today, or from the current end date if still valid).
     */
    @Transactional
    public SaleResponse create(Long ownerId, Long gymId, SaleRequest req) {
        Gym gym = gymService.requireOwned(ownerId, gymId);
        MembershipPlan plan = req.planId() == null ? null : planService.require(gymId, req.planId());
        Member member = req.memberId() == null ? null : memberService.require(gymId, req.memberId());

        String concept = req.concept() != null && !req.concept().isBlank() ? req.concept().trim()
                : plan != null ? plan.getName() : null;
        BigDecimal amount = req.amount() != null ? req.amount() : plan != null ? plan.getPrice() : null;
        if (concept == null) throw ApiException.badRequest("El concepto es obligatorio si no eliges un plan");
        if (amount == null) throw ApiException.badRequest("El monto es obligatorio si no eliges un plan");

        Sale s = new Sale();
        s.setGym(gym);
        s.setPlan(plan);
        s.setMember(member);
        s.setConcept(concept);
        s.setAmount(amount);
        s.setPaymentMethod(req.paymentMethod() == null ? PaymentMethod.CASH : req.paymentMethod());
        s.setSoldAt(req.soldAt() == null ? LocalDateTime.now() : req.soldAt());
        s.setNotes(req.notes());

        if (plan != null && member != null) {
            LocalDate saleDay = s.getSoldAt().toLocalDate();
            LocalDate currentEnd = member.getMembershipEndsAt();
            LocalDate base = currentEnd != null && !currentEnd.isBefore(saleDay) ? currentEnd : saleDay;
            member.setPlan(plan);
            member.setMembershipEndsAt(base.plusDays(plan.getDurationDays()));
            member.setStatus(MemberStatus.ACTIVE);
        }
        return SaleResponse.from(sales.save(s));
    }

    @Transactional
    public void delete(Long ownerId, Long gymId, Long saleId) {
        gymService.requireOwned(ownerId, gymId);
        Sale s = sales.findByIdAndGymId(saleId, gymId).orElseThrow(() -> ApiException.notFound("Venta no encontrada"));
        sales.delete(s);
    }
}
