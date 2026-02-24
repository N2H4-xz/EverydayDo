package org.stnhh.everydaydo.model.dto.task;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import org.stnhh.everydaydo.model.enums.RecurrenceType;

public record CreateTemplateRequest(
        @NotBlank String title,
        String description,
        @NotNull @Min(5) @Max(720) Integer estimatedMinutes,
        @NotNull @Min(1) @Max(5) Integer priority,
        @NotNull RecurrenceType recurrenceType,
        @Min(1) @Max(7) Integer dayOfWeek,
        LocalDate specificDate,
        @Min(1) @Max(365) Integer intervalDays,
        LocalTime defaultStartTime,
        LocalDate activeFrom,
        LocalDate activeTo
) {
}
