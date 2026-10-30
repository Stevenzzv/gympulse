package com.gymsaas.web.controller;

import com.gymsaas.domain.MemberStatus;
import com.gymsaas.security.AuthUser;
import com.gymsaas.service.*;
import com.gymsaas.web.dto.GymDtos.*;
import com.gymsaas.web.dto.StatsDtos.StatsResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Everything a gym owner manages, always scoped to a gym they own. */
@RestController
@RequestMapping("/api/gyms")
public class GymController {

    private final GymService gyms;
    private final PlanService plans;
    private final MemberService members;
    private final SaleService sales;
    private final StatsService stats;

    public GymController(GymService gyms, PlanService plans, MemberService members,
                         SaleService sales, StatsService stats) {
        this.gyms = gyms;
        this.plans = plans;
        this.members = members;
        this.sales = sales;
        this.stats = stats;
    }

    // ---- Gyms
    @GetMapping
    public List<GymResponse> listGyms(@AuthenticationPrincipal AuthUser me) {
        return gyms.list(me.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GymResponse createGym(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody GymRequest req) {
        return gyms.create(me.id(), req);
    }

    @PutMapping("/{gymId}")
    public GymResponse updateGym(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                 @Valid @RequestBody GymRequest req) {
        return gyms.update(me.id(), gymId, req);
    }

    @DeleteMapping("/{gymId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGym(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId) {
        gyms.delete(me.id(), gymId);
    }

    // ---- Plans
    @GetMapping("/{gymId}/plans")
    public List<PlanResponse> listPlans(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId) {
        return plans.list(me.id(), gymId);
    }

    @PostMapping("/{gymId}/plans")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanResponse createPlan(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                   @Valid @RequestBody PlanRequest req) {
        return plans.create(me.id(), gymId, req);
    }

    @PutMapping("/{gymId}/plans/{planId}")
    public PlanResponse updatePlan(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                   @PathVariable Long planId, @Valid @RequestBody PlanRequest req) {
        return plans.update(me.id(), gymId, planId, req);
    }

    @DeleteMapping("/{gymId}/plans/{planId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId, @PathVariable Long planId) {
        plans.delete(me.id(), gymId, planId);
    }

    // ---- Members
    @GetMapping("/{gymId}/members")
    public Page<MemberResponse> listMembers(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                            @RequestParam(defaultValue = "") String q,
                                            @RequestParam(required = false) MemberStatus status,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return members.search(me.id(), gymId, q, status, page, size);
    }

    @GetMapping("/{gymId}/members/{memberId}")
    public MemberResponse getMember(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                    @PathVariable Long memberId) {
        return members.get(me.id(), gymId, memberId);
    }

    @PostMapping("/{gymId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse createMember(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                       @Valid @RequestBody MemberRequest req) {
        return members.create(me.id(), gymId, req);
    }

    @PutMapping("/{gymId}/members/{memberId}")
    public MemberResponse updateMember(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                       @PathVariable Long memberId, @Valid @RequestBody MemberRequest req) {
        return members.update(me.id(), gymId, memberId, req);
    }

    @DeleteMapping("/{gymId}/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMember(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                             @PathVariable Long memberId) {
        members.delete(me.id(), gymId, memberId);
    }

    // ---- Sales
    @GetMapping("/{gymId}/sales")
    public Page<SaleResponse> listSales(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return sales.list(me.id(), gymId, from, to, page, size);
    }

    @PostMapping("/{gymId}/sales")
    @ResponseStatus(HttpStatus.CREATED)
    public SaleResponse createSale(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                                   @Valid @RequestBody SaleRequest req) {
        return sales.create(me.id(), gymId, req);
    }

    @DeleteMapping("/{gymId}/sales/{saleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSale(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId, @PathVariable Long saleId) {
        sales.delete(me.id(), gymId, saleId);
    }

    // ---- Stats
    @GetMapping("/{gymId}/stats")
    public StatsResponse stats(@AuthenticationPrincipal AuthUser me, @PathVariable Long gymId,
                               @RequestParam(defaultValue = "12") int months) {
        return stats.stats(me.id(), gymId, months);
    }
}
