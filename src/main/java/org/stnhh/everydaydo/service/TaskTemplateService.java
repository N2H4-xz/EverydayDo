package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.stnhh.everydaydo.mapper.TaskTemplateMapper;
import org.stnhh.everydaydo.model.dto.task.CreateTemplateRequest;
import org.stnhh.everydaydo.model.dto.task.TaskTemplateResponse;
import org.stnhh.everydaydo.model.dto.task.UpdateTemplateRequest;
import org.stnhh.everydaydo.model.entity.TaskTemplateEntity;
import org.stnhh.everydaydo.model.enums.RecurrenceType;

@Service
@RequiredArgsConstructor
public class TaskTemplateService {

    private final TaskTemplateMapper taskTemplateMapper;

    @Transactional
    public TaskTemplateResponse create(Long userId, CreateTemplateRequest request) {
        validateRequest(request);

        TaskTemplateEntity entity = new TaskTemplateEntity();
        entity.setUserId(userId);
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setEstimatedMinutes(request.estimatedMinutes());
        entity.setPriority(request.priority());
        entity.setRecurrenceType(request.recurrenceType());
        entity.setDayOfWeek(request.dayOfWeek());
        entity.setSpecificDate(request.specificDate());
        entity.setDefaultStartTime(request.defaultStartTime());
        entity.setActiveFrom(request.activeFrom());
        entity.setActiveTo(request.activeTo());
        entity.setEnabled(true);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        taskTemplateMapper.insert(entity);
        return toResponse(entity);
    }

    @Transactional
    public TaskTemplateResponse update(Long userId, Long templateId, UpdateTemplateRequest request) {
        validateRequest(
                request.recurrenceType(),
                request.dayOfWeek(),
                request.specificDate(),
                request.activeFrom(),
                request.activeTo()
        );

        TaskTemplateEntity entity = requireOwnedTemplate(userId, templateId);
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setEstimatedMinutes(request.estimatedMinutes());
        entity.setPriority(request.priority());
        entity.setRecurrenceType(request.recurrenceType());
        entity.setDayOfWeek(request.dayOfWeek());
        entity.setSpecificDate(request.specificDate());
        entity.setDefaultStartTime(request.defaultStartTime());
        entity.setActiveFrom(request.activeFrom());
        entity.setActiveTo(request.activeTo());
        entity.setEnabled(request.enabled());
        entity.setUpdatedAt(LocalDateTime.now());
        taskTemplateMapper.updateById(entity);
        return toResponse(entity);
    }

    @Transactional
    public TaskTemplateResponse setEnabled(Long userId, Long templateId, boolean enabled) {
        TaskTemplateEntity entity = requireOwnedTemplate(userId, templateId);
        entity.setEnabled(enabled);
        entity.setUpdatedAt(LocalDateTime.now());
        taskTemplateMapper.updateById(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(Long userId, Long templateId) {
        TaskTemplateEntity entity = requireOwnedTemplate(userId, templateId);
        taskTemplateMapper.deleteById(entity.getId());
    }

    public List<TaskTemplateResponse> listByUser(Long userId) {
        return taskTemplateMapper.selectList(new LambdaQueryWrapper<TaskTemplateEntity>()
                        .eq(TaskTemplateEntity::getUserId, userId)
                        .orderByDesc(TaskTemplateEntity::getId))
                .stream().map(this::toResponse).toList();
    }

    public List<TaskTemplateEntity> findActiveTemplatesForDate(LocalDate date) {
        return taskTemplateMapper.selectList(new LambdaQueryWrapper<TaskTemplateEntity>()
                .eq(TaskTemplateEntity::getEnabled, true)
                .and(w -> w.isNull(TaskTemplateEntity::getActiveFrom).or().le(TaskTemplateEntity::getActiveFrom, date))
                .and(w -> w.isNull(TaskTemplateEntity::getActiveTo).or().ge(TaskTemplateEntity::getActiveTo, date)));
    }

    private void validateRequest(CreateTemplateRequest request) {
        validateRequest(
                request.recurrenceType(),
                request.dayOfWeek(),
                request.specificDate(),
                request.activeFrom(),
                request.activeTo()
        );
    }

    private void validateRequest(
            RecurrenceType recurrenceType,
            Integer dayOfWeek,
            LocalDate specificDate,
            LocalDate activeFrom,
            LocalDate activeTo
    ) {
        if (recurrenceType == RecurrenceType.WEEKLY && dayOfWeek == null) {
            throw new IllegalArgumentException("dayOfWeek is required for WEEKLY templates");
        }
        if (recurrenceType == RecurrenceType.SPECIFIC_DATE && specificDate == null) {
            throw new IllegalArgumentException("specificDate is required for SPECIFIC_DATE templates");
        }
        if (activeFrom != null && activeTo != null && activeFrom.isAfter(activeTo)) {
            throw new IllegalArgumentException("activeFrom cannot be later than activeTo");
        }
    }

    private TaskTemplateEntity requireOwnedTemplate(Long userId, Long templateId) {
        TaskTemplateEntity entity = taskTemplateMapper.selectOne(new LambdaQueryWrapper<TaskTemplateEntity>()
                .eq(TaskTemplateEntity::getId, templateId)
                .eq(TaskTemplateEntity::getUserId, userId));
        if (entity == null) {
            throw new IllegalArgumentException("Template not found");
        }
        return entity;
    }

    private TaskTemplateResponse toResponse(TaskTemplateEntity entity) {
        return new TaskTemplateResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getEstimatedMinutes(),
                entity.getPriority(),
                entity.getRecurrenceType(),
                entity.getDayOfWeek(),
                entity.getSpecificDate(),
                entity.getDefaultStartTime(),
                entity.getActiveFrom(),
                entity.getActiveTo(),
                entity.getEnabled()
        );
    }
}
