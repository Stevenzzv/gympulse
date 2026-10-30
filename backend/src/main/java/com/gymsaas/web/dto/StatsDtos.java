package com.gymsaas.web.dto;

import java.math.BigDecimal;
import java.util.List;

public final class StatsDtos {
    private StatsDtos() {}

    public record MonthPoint(String month, BigDecimal revenue, long sales, long newMembers) {}

    public record Breakdown(String label, BigDecimal revenue, long count) {}

    public record StatsResponse(
            BigDecimal totalRevenue,
            BigDecimal revenueThisMonth,
            BigDecimal revenueLastMonth,
            Double revenueGrowthPct,
            long salesThisMonth,
            long salesLastMonth,
            BigDecimal averageTicket,
            long totalMembers,
            long activeMembers,
            long membersWithValidPlan,
            long newMembersThisMonth,
            long expiringNext7Days,
            List<MonthPoint> monthly,
            List<Breakdown> byConcept,
            List<Breakdown> byPaymentMethod) {}
}
