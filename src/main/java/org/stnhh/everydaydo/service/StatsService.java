package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.stnhh.everydaydo.mapper.CompletionLogMapper;
import org.stnhh.everydaydo.mapper.TaskInstanceMapper;
import org.stnhh.everydaydo.mapper.TimeWindowCheckinMapper;
import org.stnhh.everydaydo.model.dto.checkin.CheckinRecordResponse;
import org.stnhh.everydaydo.model.dto.checkin.HourlyCheckinResponse;
import org.stnhh.everydaydo.model.dto.common.PageResponse;
import org.stnhh.everydaydo.model.dto.stats.CompletionSummaryResponse;
import org.stnhh.everydaydo.model.entity.CompletionLogEntity;
import org.stnhh.everydaydo.model.entity.TaskInstanceEntity;
import org.stnhh.everydaydo.model.entity.TimeWindowCheckinEntity;
import org.stnhh.everydaydo.model.enums.SummaryPeriod;
import org.stnhh.everydaydo.model.enums.TaskStatus;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final TaskInstanceMapper taskInstanceMapper;
    private final TimeWindowCheckinMapper timeWindowCheckinMapper;
    private final CompletionLogMapper completionLogMapper;

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

    public PageResponse<HourlyCheckinResponse> reviewPage(Long userId, Integer page, Integer size, LocalDate date) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 10 : Math.min(size, 50);

        LambdaQueryWrapper<TimeWindowCheckinEntity> wrapper = new LambdaQueryWrapper<TimeWindowCheckinEntity>()
                .eq(TimeWindowCheckinEntity::getUserId, userId)
                .orderByDesc(TimeWindowCheckinEntity::getWindowStart)
                .orderByDesc(TimeWindowCheckinEntity::getId);

        if (date != null) {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();
            wrapper.ge(TimeWindowCheckinEntity::getWindowStart, start)
                    .lt(TimeWindowCheckinEntity::getWindowStart, end);
        }

        List<TimeWindowCheckinEntity> allCheckins = timeWindowCheckinMapper.selectList(wrapper);
        int total = allCheckins.size();
        int fromIndex = (safePage - 1) * safeSize;
        if (fromIndex >= total) {
            return new PageResponse<>(List.of(), safePage, safeSize, total, totalPages(total, safeSize));
        }

        int toIndex = Math.min(fromIndex + safeSize, total);
        List<TimeWindowCheckinEntity> pageCheckins = allCheckins.subList(fromIndex, toIndex);
        Set<Long> checkinIds = pageCheckins.stream().map(TimeWindowCheckinEntity::getId).collect(Collectors.toSet());

        Map<Long, List<CompletionLogEntity>> logsByCheckinId = completionLogMapper.selectList(
                        new LambdaQueryWrapper<CompletionLogEntity>()
                                .in(CompletionLogEntity::getCheckinId, checkinIds)
                                .orderByAsc(CompletionLogEntity::getId)
                )
                .stream()
                .collect(Collectors.groupingBy(CompletionLogEntity::getCheckinId));

        List<HourlyCheckinResponse> items = new ArrayList<>();
        for (TimeWindowCheckinEntity checkin : pageCheckins) {
            List<CheckinRecordResponse> records = logsByCheckinId
                    .getOrDefault(checkin.getId(), List.of())
                    .stream()
                    .map(log -> new CheckinRecordResponse(
                            log.getTaskInstanceId(),
                            log.getAddedMinutes(),
                            log.getComment(),
                            log.getReferenceLink(),
                            false
                    ))
                    .toList();

            items.add(new HourlyCheckinResponse(
                    checkin.getId(),
                    checkin.getWindowStart(),
                    checkin.getWindowEnd(),
                    checkin.getOverallComment(),
                    records
            ));
        }

        return new PageResponse<>(items, safePage, safeSize, total, totalPages(total, safeSize));
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

    private int totalPages(int total, int size) {
        return total == 0 ? 0 : (int) Math.ceil((double) total / size);
    }

    private record DateRange(LocalDate start, LocalDate endExclusive) {
    }
}
