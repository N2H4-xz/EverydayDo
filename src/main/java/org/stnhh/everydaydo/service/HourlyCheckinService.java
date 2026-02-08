package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.stnhh.everydaydo.mapper.CompletionLogMapper;
import org.stnhh.everydaydo.mapper.TaskInstanceMapper;
import org.stnhh.everydaydo.mapper.TimeWindowCheckinMapper;
import org.stnhh.everydaydo.model.dto.checkin.CheckinRecordRequest;
import org.stnhh.everydaydo.model.dto.checkin.CheckinRecordResponse;
import org.stnhh.everydaydo.model.dto.checkin.HourlyCheckinResponse;
import org.stnhh.everydaydo.model.dto.checkin.PendingWindowCheckinResponse;
import org.stnhh.everydaydo.model.dto.checkin.SubmitHourlyCheckinRequest;
import org.stnhh.everydaydo.model.dto.task.TaskInstanceResponse;
import org.stnhh.everydaydo.model.entity.CompletionLogEntity;
import org.stnhh.everydaydo.model.entity.TaskInstanceEntity;
import org.stnhh.everydaydo.model.entity.TimeWindowCheckinEntity;
import org.stnhh.everydaydo.model.enums.TaskStatus;

@Service
@RequiredArgsConstructor
public class HourlyCheckinService {

    private final TimeWindowCheckinMapper timeWindowCheckinMapper;
    private final CompletionLogMapper completionLogMapper;
    private final TaskInstanceMapper taskInstanceMapper;
    private final TaskInstanceService taskInstanceService;

    @Transactional
    public HourlyCheckinResponse submit(Long userId, SubmitHourlyCheckinRequest request) {
        if (!request.windowStart().isBefore(request.windowEnd())) {
            throw new IllegalArgumentException("windowStart must be before windowEnd");
        }
        if (hasSubmitted(userId, request.windowStart(), request.windowEnd())) {
            throw new IllegalArgumentException("This time window is already submitted");
        }

        TimeWindowCheckinEntity checkin = new TimeWindowCheckinEntity();
        checkin.setUserId(userId);
        checkin.setWindowStart(request.windowStart());
        checkin.setWindowEnd(request.windowEnd());
        checkin.setOverallComment(request.overallComment());
        checkin.setCreatedAt(LocalDateTime.now());
        timeWindowCheckinMapper.insert(checkin);

        List<CheckinRecordResponse> recordResponses = new ArrayList<>();
        for (CheckinRecordRequest record : request.records()) {
            if (record.completedMinutes() == null || record.completedMinutes() <= 0) {
                throw new IllegalArgumentException("completedMinutes must be greater than 0");
            }

            Long taskInstanceId;
            boolean createdAsAdHoc = false;

            if (record.taskInstanceId() != null) {
                taskInstanceId = taskInstanceService.addCompletionMinutes(
                        userId,
                        record.taskInstanceId(),
                        record.completedMinutes()
                );
            } else {
                if (!StringUtils.hasText(record.title())) {
                    throw new IllegalArgumentException("title is required when taskInstanceId is missing");
                }
                TaskInstanceEntity adHoc = taskInstanceService.createAdHocFromCheckin(
                        userId,
                        record.title().trim(),
                        request.windowStart().toLocalDate(),
                        record.completedMinutes()
                );
                taskInstanceId = adHoc.getId();
                createdAsAdHoc = true;
            }

            CompletionLogEntity log = new CompletionLogEntity();
            log.setCheckinId(checkin.getId());
            log.setUserId(userId);
            log.setTaskInstanceId(taskInstanceId);
            log.setAddedMinutes(record.completedMinutes());
            log.setComment(record.comment());
            log.setReferenceLink(record.referenceLink());
            log.setCreatedAt(LocalDateTime.now());
            completionLogMapper.insert(log);

            recordResponses.add(new CheckinRecordResponse(
                    taskInstanceId,
                    record.completedMinutes(),
                    record.comment(),
                    record.referenceLink(),
                    createdAsAdHoc
            ));
        }

        return new HourlyCheckinResponse(
                checkin.getId(),
                checkin.getWindowStart(),
                checkin.getWindowEnd(),
                checkin.getOverallComment(),
                recordResponses
        );
    }

    public List<HourlyCheckinResponse> listByDate(Long userId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<TimeWindowCheckinEntity> checkins = timeWindowCheckinMapper.selectList(
                new LambdaQueryWrapper<TimeWindowCheckinEntity>()
                        .eq(TimeWindowCheckinEntity::getUserId, userId)
                        .ge(TimeWindowCheckinEntity::getWindowStart, start)
                        .lt(TimeWindowCheckinEntity::getWindowStart, end)
                        .orderByDesc(TimeWindowCheckinEntity::getWindowStart)
        );

        return checkins.stream().map(checkin -> {
            List<CheckinRecordResponse> records = completionLogMapper.selectList(
                            new LambdaQueryWrapper<CompletionLogEntity>()
                                    .eq(CompletionLogEntity::getCheckinId, checkin.getId())
                                    .orderByAsc(CompletionLogEntity::getId)
                    )
                    .stream()
                    .map(log -> new CheckinRecordResponse(
                            log.getTaskInstanceId(),
                            log.getAddedMinutes(),
                            log.getComment(),
                            log.getReferenceLink(),
                            false
                    ))
                    .toList();

            return new HourlyCheckinResponse(
                    checkin.getId(),
                    checkin.getWindowStart(),
                    checkin.getWindowEnd(),
                    checkin.getOverallComment(),
                    records
            );
        }).toList();
    }

    public List<TaskInstanceEntity> listWindowPlannedTasks(Long userId, LocalDateTime windowStart, LocalDateTime windowEnd) {
        if (!windowStart.isBefore(windowEnd)) {
            throw new IllegalArgumentException("windowStart must be before windowEnd");
        }

        return taskInstanceMapper.selectList(new LambdaQueryWrapper<TaskInstanceEntity>()
                        .eq(TaskInstanceEntity::getUserId, userId)
                        .between(TaskInstanceEntity::getPlanDate, windowStart.toLocalDate(), windowEnd.toLocalDate())
                        .ne(TaskInstanceEntity::getStatus, TaskStatus.CANCELLED)
                        .orderByAsc(TaskInstanceEntity::getPlanDate)
                        .orderByAsc(TaskInstanceEntity::getPlannedStartTime)
                        .orderByDesc(TaskInstanceEntity::getId))
                .stream()
                .filter(task -> {
                    if (task.getPlannedStartTime() == null) {
                        return task.getPlanDate().equals(windowStart.toLocalDate());
                    }
                    LocalDateTime plannedAt = LocalDateTime.of(task.getPlanDate(), task.getPlannedStartTime());
                    return (!plannedAt.isBefore(windowStart)) && plannedAt.isBefore(windowEnd);
                })
                .toList();
    }

    public List<TaskInstanceResponse> listWindowPlannedTaskResponses(Long userId, LocalDateTime windowStart, LocalDateTime windowEnd) {
        return listWindowPlannedTasks(userId, windowStart, windowEnd).stream().map(this::toTaskResponse).toList();
    }

    public PendingWindowCheckinResponse previousWindowPrompt(Long userId, LocalDateTime referenceTime, int windowMinutes) {
        if (windowMinutes <= 0 || windowMinutes > 720) {
            throw new IllegalArgumentException("windowMinutes must be between 1 and 720");
        }

        LocalDateTime now = referenceTime.truncatedTo(ChronoUnit.MINUTES);
        int minuteOfDay = now.getHour() * 60 + now.getMinute();
        int currentWindowStartMinute = (minuteOfDay / windowMinutes) * windowMinutes;

        LocalDateTime currentWindowStart = now.toLocalDate().atStartOfDay().plusMinutes(currentWindowStartMinute);
        LocalDateTime windowEnd = currentWindowStart;
        LocalDateTime windowStart = currentWindowStart.minusMinutes(windowMinutes);

        boolean submitted = hasSubmitted(userId, windowStart, windowEnd);
        List<TaskInstanceResponse> plannedTasks = listWindowPlannedTasks(userId, windowStart, windowEnd)
                .stream().map(this::toTaskResponse).toList();

        String prompt = "请回顾上个时间窗口完成情况，可补充完成时长、评论和参考链接。";
        return new PendingWindowCheckinResponse(
                windowStart,
                windowEnd,
                windowMinutes,
                submitted,
                prompt,
                plannedTasks
        );
    }

    private boolean hasSubmitted(Long userId, LocalDateTime windowStart, LocalDateTime windowEnd) {
        Long count = timeWindowCheckinMapper.selectCount(new LambdaQueryWrapper<TimeWindowCheckinEntity>()
                .eq(TimeWindowCheckinEntity::getUserId, userId)
                .eq(TimeWindowCheckinEntity::getWindowStart, windowStart)
                .eq(TimeWindowCheckinEntity::getWindowEnd, windowEnd));
        return count != null && count > 0;
    }

    private TaskInstanceResponse toTaskResponse(TaskInstanceEntity entity) {
        return new TaskInstanceResponse(
                entity.getId(),
                entity.getTemplateId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getPlanDate(),
                entity.getPlannedStartTime(),
                entity.getPlannedMinutes(),
                entity.getCompletedMinutes(),
                entity.getStatus(),
                entity.getAdHoc()
        );
    }
}
