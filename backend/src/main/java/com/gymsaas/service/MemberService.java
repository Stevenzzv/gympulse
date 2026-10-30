package com.gymsaas.service;

import com.gymsaas.domain.Gym;
import com.gymsaas.domain.Member;
import com.gymsaas.domain.MemberStatus;
import com.gymsaas.repository.MemberRepository;
import com.gymsaas.repository.SaleRepository;
import com.gymsaas.web.ApiException;
import com.gymsaas.web.dto.GymDtos.MemberRequest;
import com.gymsaas.web.dto.GymDtos.MemberResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberService {

    private final GymService gymService;
    private final PlanService planService;
    private final MemberRepository members;
    private final SaleRepository sales;

    public MemberService(GymService gymService, PlanService planService,
                         MemberRepository members, SaleRepository sales) {
        this.gymService = gymService;
        this.planService = planService;
        this.members = members;
        this.sales = sales;
    }

    Member require(Long gymId, Long memberId) {
        return members.findByIdAndGymId(memberId, gymId).orElseThrow(() -> ApiException.notFound("Miembro no encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<MemberResponse> search(Long ownerId, Long gymId, String q, MemberStatus status, int page, int size) {
        gymService.requireOwned(ownerId, gymId);
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return members.search(gymId, q == null ? "" : q.trim(), status, pageable).map(MemberResponse::from);
    }

    @Transactional(readOnly = true)
    public MemberResponse get(Long ownerId, Long gymId, Long memberId) {
        gymService.requireOwned(ownerId, gymId);
        return MemberResponse.from(require(gymId, memberId));
    }

    @Transactional
    public MemberResponse create(Long ownerId, Long gymId, MemberRequest req) {
        Gym gym = gymService.requireOwned(ownerId, gymId);
        Member m = new Member();
        m.setGym(gym);
        apply(gymId, m, req);
        return MemberResponse.from(members.save(m));
    }

    @Transactional
    public MemberResponse update(Long ownerId, Long gymId, Long memberId, MemberRequest req) {
        gymService.requireOwned(ownerId, gymId);
        Member m = require(gymId, memberId);
        apply(gymId, m, req);
        return MemberResponse.from(m);
    }

    @Transactional
    public void delete(Long ownerId, Long gymId, Long memberId) {
        gymService.requireOwned(ownerId, gymId);
        Member m = require(gymId, memberId);
        sales.detachMember(m.getId()); // revenue history stays intact
        members.delete(m);
    }

    private void apply(Long gymId, Member m, MemberRequest req) {
        m.setFirstName(req.firstName().trim());
        m.setLastName(req.lastName().trim());
        m.setEmail(blankToNull(req.email()));
        m.setPhone(blankToNull(req.phone()));
        m.setDocumentId(blankToNull(req.documentId()));
        m.setBirthDate(req.birthDate());
        m.setObservations(req.observations());
        if (req.status() != null) m.setStatus(req.status());
        if (req.joinedAt() != null) m.setJoinedAt(req.joinedAt());
        m.setPlan(req.planId() == null ? null : planService.require(gymId, req.planId()));
        m.setMembershipEndsAt(req.membershipEndsAt());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
