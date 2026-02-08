package org.stnhh.everydaydo.model.dto.task;

import java.time.LocalDate;
import java.time.LocalTime;
import org.stnhh.everydaydo.model.enums.TaskStatus;

public record TaskInstanceResponse(
        Long id,
        Long templateId,
        String title,
        String description,
        LocalDate planDate,
        LocalTime plannedStartTime,
        Integer plannedMinutes,
        Integer completedMinutes,
        TaskStatus status,
        Boolean adHoc
) {
}
