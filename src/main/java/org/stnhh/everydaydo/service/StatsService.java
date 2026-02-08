package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.stnhh.everydaydo.mapper.TaskInstanceMapper;
import org.stnhh.everydaydo.model.dto.stats.CompletionSummaryResponse;
import org.stnhh.everydaydo.model.entity.TaskInstanceEntity;
import org.stnhh.everydaydo.model.enums.SummaryPeriod;
import org.stnhh.everydaydo.model.enums.TaskStatus;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final TaskInstanceMapper taskInstanceMapper;

    public CompletionSummaryResponse completionSummary(Long userId, SummaryPeriod period, LocalDate referenceDate) {
        DateRange range = rangeFor(period, referenceDate);
        List<TaskInstanceEntity> tasks = taskInstanceMapper.selectList(new LambdaQueryWrapper<TaskInstanceEntity>()
                .eq(TaskInstanceEntity::getUserId, userId)
                .ge(TaskInstanceEntity::getPlanDate, range.start())
                .lt(TaskInstanceEntity::getPlanDate, range.endExclusive()));

        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        int adHocTasks = (int) tasks.stream().filter(t -> Boolean.TRUE.equals(t.getAdHoc())).count();
        int plannedMinutes = tasks.stream().map(TaskInstanceEntity::getPlannedMinutes).filter(v -> v != null).mapToInt(Integer::intValue).sum();
        int completedMinutes = tasks.stream().map(TaskInstanceEntity::getCompletedMinutes).filter(v -> v != null).mapToInt(Integer::intValue).sum();

        double taskCompletionRate = totalTasks == 0 ? 0.0 : round2((double) completedTasks / totalTasks);
        double minuteCompletionRate = plannedMinutes == 0 ? 0.0 : round2((double) completedMinutes / plannedMinutes);

        return new CompletionSummaryResponse(
                period,
                range.start(),
                range.endExclusive().minusDays(1),
                totalTasks,
                completedTasks,
                adHocTasks,
                plannedMinutes,
                completedMinutes,
                taskCompletionRate,
                minuteCompletionRate
        );
    }

    private DateRange rangeFor(SummaryPeriod period, LocalDate referenceDate) {
        return switch (period) {
            case WEEK -> {
                LocalDate start = referenceDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                yield new DateRange(start, start.plusDays(7));
            }
            case MONTH -> {
                LocalDate start = referenceDate.withDayOfMonth(1);
                yield new DateRange(start, start.plusMonths(1));
            }
            case YEAR -> {
                LocalDate start = referenceDate.withDayOfYear(1);
                yield new DateRange(start, start.plusYears(1));
            }
        };
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record DateRange(LocalDate start, LocalDate endExclusive) {
    }
}
