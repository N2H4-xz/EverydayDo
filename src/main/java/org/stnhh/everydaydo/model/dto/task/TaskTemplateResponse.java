package org.stnhh.everydaydo.model.dto.task;

import java.time.LocalDate;
import java.time.LocalTime;
import org.stnhh.everydaydo.model.enums.RecurrenceType;

public record TaskTemplateResponse(
        Long id,
        String title,
        String description,
        Integer estimatedMinutes,
        Integer priority,
        RecurrenceType recurrenceType,
        Integer dayOfWeek,
        LocalDate specificDate,
        Integer intervalDays,
        LocalTime defaultStartTime,
        LocalDate activeFrom,
        LocalDate activeTo,
        Boolean enabled
) {
}
