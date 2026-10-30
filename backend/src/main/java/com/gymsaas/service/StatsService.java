package com.gymsaas.service;

import com.gymsaas.domain.MemberStatus;
import com.gymsaas.repository.MemberRepository;
import com.gymsaas.repository.SaleRepository;
import com.gymsaas.web.dto.StatsDtos.Breakdown;
import com.gymsaas.web.dto.StatsDtos.MonthPoint;
import com.gymsaas.web.dto.StatsDtos.StatsResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    private final GymService gymService;
    private final SaleRepository sales;
    private final MemberRepository members;

    public StatsService(GymService gymService, SaleRepository sales, MemberRepository members) {
        this.gymService = gymService;
        this.sales = sales;
        this.members = members;
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(Long ownerId, Long gymId, int months) {
        gymService.requireOwned(ownerId, gymId);
        months = Math.min(Math.max(months, 1), 36);

        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.from(today);
        LocalDateTime thisMonthStart = thisMonth.atDay(1).atStartOfDay();
        LocalDateTime nextMonthStart = thisMonth.plusMonths(1).atDay(1).atStartOfDay();
        LocalDateTime lastMonthStart = thisMonth.minusMonths(1).atDay(1).atStartOfDay();
        YearMonth firstMonth = thisMonth.minusMonths(months - 1L);
        LocalDateTime windowStart = firstMonth.atDay(1).atStartOfDay();

        BigDecimal revThis = sales.sumInRange(gymId, thisMonthStart, nextMonthStart);
        BigDecimal revLast = sales.sumInRange(gymId, lastMonthStart, thisMonthStart);
        long salesThis = sales.countInRange(gymId, thisMonthStart, nextMonthStart);
        long salesLast = sales.countInRange(gymId, lastMonthStart, thisMonthStart);

        Double growth = revLast.signum() == 0 ? null
                : revThis.subtract(revLast).multiply(BigDecimal.valueOf(100))
                         .divide(revLast, 1, RoundingMode.HALF_UP).doubleValue();
        BigDecimal avgTicket = salesThis == 0 ? BigDecimal.ZERO
                : revThis.divide(BigDecimal.valueOf(salesThis), 2, RoundingMode.HALF_UP);

        // Monthly series, every month present even when empty so charts have no gaps.
        Map<YearMonth, BigDecimal> revenue = new LinkedHashMap<>();
        Map<YearMonth, Long> count = new LinkedHashMap<>();
        Map<YearMonth, Long> joined = new LinkedHashMap<>();
        for (YearMonth ym = firstMonth; !ym.isAfter(thisMonth); ym = ym.plusMonths(1)) {
            revenue.put(ym, BigDecimal.ZERO);
            count.put(ym, 0L);
            joined.put(ym, 0L);
        }
        for (Object[] row : sales.amountsSince(gymId, windowStart)) {
            YearMonth ym = YearMonth.from((LocalDateTime) row[0]);
            if (revenue.containsKey(ym)) {
                revenue.merge(ym, (BigDecimal) row[1], BigDecimal::add);
                count.merge(ym, 1L, Long::sum);
            }
        }
        for (LocalDate d : members.joinDatesSince(gymId, windowStart.toLocalDate())) {
            joined.computeIfPresent(YearMonth.from(d), (k, v) -> v + 1);
        }
        List<MonthPoint> monthly = new ArrayList<>();
        revenue.forEach((ym, rev) -> monthly.add(new MonthPoint(ym.toString(), rev, count.get(ym), joined.get(ym))));

        List<Breakdown> byConcept = sales.revenueByConcept(gymId, windowStart).stream()
                .map(r -> new Breakdown((String) r[0], (BigDecimal) r[1], (Long) r[2])).toList();
        List<Breakdown> byMethod = sales.revenueByPaymentMethod(gymId, windowStart).stream()
                .map(r -> new Breakdown(r[0].toString(), (BigDecimal) r[1], (Long) r[2])).toList();

        return new StatsResponse(
                sales.sumAll(gymId), revThis, revLast, growth, salesThis, salesLast, avgTicket,
                members.countByGymId(gymId),
                members.countByGymIdAndStatus(gymId, MemberStatus.ACTIVE),
                members.countWithValidMembership(gymId, today),
                joined.get(thisMonth),
                members.countExpiringBetween(gymId, today, today.plusDays(7)),
                monthly, byConcept, byMethod);
    }
}
