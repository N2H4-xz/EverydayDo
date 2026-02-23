package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.stnhh.everydaydo.mapper.TaskInstanceMapper;
import org.stnhh.everydaydo.model.dto.task.CreateManualTaskRequest;
import org.stnhh.everydaydo.model.dto.task.TaskInstanceResponse;
import org.stnhh.everydaydo.model.dto.task.UpdateTaskRequest;
import org.stnhh.everydaydo.model.entity.TaskInstanceEntity;
import org.stnhh.everydaydo.model.entity.TaskTemplateEntity;
import org.stnhh.everydaydo.model.enums.TaskStatus;

@Service
@RequiredArgsConstructor
public class TaskInstanceService {

    private final TaskInstanceMapper taskInstanceMapper;

    @Transactional
    public TaskInstanceResponse createManual(Long userId, CreateManualTaskRequest request) {
        TaskInstanceEntity entity = new TaskInstanceEntity();
        entity.setUserId(userId);
        entity.setTemplateId(null);
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setPlanDate(request.planDate());
        entity.setPlannedStartTime(request.plannedStartTime());
        entity.setPlannedMinutes(request.plannedMinutes());
        entity.setCompletedMinutes(0);
        entity.setStatus(TaskStatus.PENDING);
        entity.setAdHoc(true);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        taskInstanceMapper.insert(entity);
        return toResponse(entity);
    }

    @Transactional
    public Long addCompletionMinutes(Long userId, Long taskInstanceId, int addedMinutes) {
        return adjustCompletionMinutes(userId, taskInstanceId, addedMinutes);
    }

    @Transactional
    public Long adjustCompletionMinutes(Long userId, Long taskInstanceId, int deltaMinutes) {
        TaskInstanceEntity task = requireOwnedTask(userId, taskInstanceId);
        int base = task.getCompletedMinutes() == null ? 0 : task.getCompletedMinutes();
        int updatedCompleted = Math.max(0, base + deltaMinutes);
        task.setCompletedMinutes(updatedCompleted);
        if (task.getStatus() != TaskStatus.CANCELLED) {
            task.setStatus(resolveStatus(updatedCompleted, task.getPlannedMinutes()));
        }
        task.setUpdatedAt(LocalDateTime.now());
        taskInstanceMapper.updateById(task);
        return task.getId();
    }

    @Transactional
    public TaskInstanceEntity createAdHocFromCheckin(Long userId, String title, LocalDate planDate, int completedMinutes) {
        if (!StringUtils.hasText(title)) {
            throw new IllegalArgumentException("title cannot be blank");
        }

        TaskInstanceEntity entity = new TaskInstanceEntity();
        entity.setUserId(userId);
        entity.setTemplateId(null);
        entity.setTitle(title.trim());
        entity.setDescription(null);
        entity.setPlanDate(planDate);
        entity.setPlannedStartTime(null);
        entity.setPlannedMinutes(completedMinutes);
        entity.setCompletedMinutes(completedMinutes);
        entity.setStatus(TaskStatus.COMPLETED);
        entity.setAdHoc(true);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        taskInstanceMapper.insert(entity);
        return entity;
    }

    public List<TaskInstanceResponse> listByDate(Long userId, LocalDate date) {
        return taskInstanceMapper.selectList(new LambdaQueryWrapper<TaskInstanceEntity>()
                        .eq(TaskInstanceEntity::getUserId, userId)
                        .eq(TaskInstanceEntity::getPlanDate, date)
                        .orderByAsc(TaskInstanceEntity::getPlannedStartTime)
                        .orderByDesc(TaskInstanceEntity::getId))
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TaskInstanceResponse update(Long userId, Long taskId, UpdateTaskRequest request) {
        TaskInstanceEntity entity = requireOwnedTask(userId, taskId);
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setPlanDate(request.planDate());
        entity.setPlannedStartTime(request.plannedStartTime());
        entity.setPlannedMinutes(request.plannedMinutes());

        int completed = entity.getCompletedMinutes() == null ? 0 : entity.getCompletedMinutes();
        if (request.status() == TaskStatus.CANCELLED) {
            entity.setStatus(TaskStatus.CANCELLED);
        } else {
            entity.setStatus(resolveStatus(completed, request.plannedMinutes()));
            if (request.status() == TaskStatus.PENDING && completed == 0) {
                entity.setStatus(TaskStatus.PENDING);
            }
        }

        entity.setUpdatedAt(LocalDateTime.now());
        taskInstanceMapper.updateById(entity);
        return toResponse(entity);
    }

    @Transactional
    public TaskInstanceResponse setStatus(Long userId, Long taskId, TaskStatus status) {
        TaskInstanceEntity entity = requireOwnedTask(userId, taskId);
        if (status == TaskStatus.PENDING && (entity.getCompletedMinutes() != null && entity.getCompletedMinutes() > 0)) {
            throw new IllegalArgumentException("Cannot set task to PENDING when completed minutes is greater than 0");
        }
        entity.setStatus(status);
        entity.setUpdatedAt(LocalDateTime.now());
        taskInstanceMapper.updateById(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(Long userId, Long taskId) {
        TaskInstanceEntity entity = requireOwnedTask(userId, taskId);
        taskInstanceMapper.deleteById(entity.getId());
    }

    @Transactional
    public void createFromTemplateIfNotExists(TaskTemplateEntity template, LocalDate date) {
        Long count = taskInstanceMapper.selectCount(new LambdaQueryWrapper<TaskInstanceEntity>()
                .eq(TaskInstanceEntity::getUserId, template.getUserId())
                .eq(TaskInstanceEntity::getTemplateId, template.getId())
                .eq(TaskInstanceEntity::getPlanDate, date));
        if (count != null && count > 0) {
            return;
        }

        TaskInstanceEntity entity = new TaskInstanceEntity();
        entity.setUserId(template.getUserId());
        entity.setTemplateId(template.getId());
        entity.setTitle(template.getTitle());
        entity.setDescription(template.getDescription());
        entity.setPlanDate(date);
        entity.setPlannedStartTime(template.getDefaultStartTime());
        entity.setPlannedMinutes(template.getEstimatedMinutes());
        entity.setCompletedMinutes(0);
        entity.setStatus(TaskStatus.PENDING);
        entity.setAdHoc(false);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        taskInstanceMapper.insert(entity);
    }

    private TaskInstanceResponse toResponse(TaskInstanceEntity entity) {
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

    private TaskInstanceEntity requireOwnedTask(Long userId, Long taskId) {
        TaskInstanceEntity task = taskInstanceMapper.selectOne(new LambdaQueryWrapper<TaskInstanceEntity>()
                .eq(TaskInstanceEntity::getId, taskId)
                .eq(TaskInstanceEntity::getUserId, userId));
        if (task == null) {
            throw new IllegalArgumentException("Task instance not found");
        }
        return task;
    }

    private TaskStatus resolveStatus(int completedMinutes, Integer plannedMinutesValue) {
        int plannedMinutes = plannedMinutesValue == null ? 0 : plannedMinutesValue;
        if (completedMinutes >= plannedMinutes) {
            return TaskStatus.COMPLETED;
        }
        if (completedMinutes > 0) {
            return TaskStatus.IN_PROGRESS;
        }
        return TaskStatus.PENDING;
    }
}
