package com.gymsaas.web.dto;

import com.gymsaas.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class GymDtos {
    private GymDtos() {}

    // ---- Gyms
    public record GymRequest(@NotBlank @Size(max = 120) String name,
                             @Size(max = 255) String address,
                             @Size(max = 40) String phone) {}

    public record GymResponse(Long id, String name, String address, String phone) {
        public static GymResponse from(Gym g) {
            return new GymResponse(g.getId(), g.getName(), g.getAddress(), g.getPhone());
        }
    }

    // ---- Plans
    public record PlanRequest(@NotBlank @Size(max = 120) String name,
                              @NotNull @DecimalMin("0.00") BigDecimal price,
                              @Min(1) @Max(3660) int durationDays,
                              @Size(max = 1000) String description,
                              Boolean active) {}

    public record PlanResponse(Long id, String name, BigDecimal price, int durationDays,
                               String description, boolean active) {
        public static PlanResponse from(MembershipPlan p) {
            return new PlanResponse(p.getId(), p.getName(), p.getPrice(), p.getDurationDays(),
                    p.getDescription(), p.isActive());
        }
    }

    // ---- Members
    public record MemberRequest(@NotBlank @Size(max = 80) String firstName,
                                @NotBlank @Size(max = 80) String lastName,
                                @Email @Size(max = 160) String email,
                                @Size(max = 40) String phone,
                                @Size(max = 40) String documentId,
                                LocalDate birthDate,
                                @Size(max = 4000) String observations,
                                MemberStatus status,
                                Long planId,
                                LocalDate joinedAt,
                                LocalDate membershipEndsAt) {}

    public record MemberResponse(Long id, String firstName, String lastName, String email, String phone,
                                 String documentId, LocalDate birthDate, String observations,
                                 MemberStatus status, Long planId, String planName,
                                 LocalDate joinedAt, LocalDate membershipEndsAt, boolean membershipValid) {
        public static MemberResponse from(Member m) {
            MembershipPlan p = m.getPlan();
            boolean valid = m.getMembershipEndsAt() != null && !m.getMembershipEndsAt().isBefore(LocalDate.now());
            return new MemberResponse(m.getId(), m.getFirstName(), m.getLastName(), m.getEmail(), m.getPhone(),
                    m.getDocumentId(), m.getBirthDate(), m.getObservations(), m.getStatus(),
                    p == null ? null : p.getId(), p == null ? null : p.getName(),
                    m.getJoinedAt(), m.getMembershipEndsAt(), valid);
        }
    }

    // ---- Sales
    public record SaleRequest(Long memberId,
                              Long planId,
                              @Size(max = 160) String concept,
                              @DecimalMin("0.00") BigDecimal amount,
                              PaymentMethod paymentMethod,
                              LocalDateTime soldAt,
                              @Size(max = 2000) String notes) {}

    public record SalesSummary(BigDecimal total, long count, BigDecimal averageTicket) {}

    public record SaleResponse(Long id, Long memberId, String memberName, Long planId, String planName,
                               String concept, BigDecimal amount, PaymentMethod paymentMethod,
                               LocalDateTime soldAt, String notes) {
        public static SaleResponse from(Sale s) {
            Member m = s.getMember();
            MembershipPlan p = s.getPlan();
            return new SaleResponse(s.getId(),
                    m == null ? null : m.getId(),
                    m == null ? null : m.getFirstName() + " " + m.getLastName(),
                    p == null ? null : p.getId(),
                    p == null ? null : p.getName(),
                    s.getConcept(), s.getAmount(), s.getPaymentMethod(), s.getSoldAt(), s.getNotes());
        }
    }
}
