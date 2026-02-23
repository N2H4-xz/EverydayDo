package org.stnhh.everydaydo.model.dto.task;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import org.stnhh.everydaydo.model.enums.TaskStatus;

public record UpdateTaskRequest(
        @NotBlank String title,
        String description,
        @NotNull LocalDate planDate,
        LocalTime plannedStartTime,
        @NotNull @Min(5) @Max(720) Integer plannedMinutes,
        @NotNull TaskStatus status
) {
}
