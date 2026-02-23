package org.stnhh.everydaydo.model.dto.holiday;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpsertHolidayRequest(
        @NotNull LocalDate holidayDate,
        @NotNull Boolean isHoliday,
        @Size(max = 64) String name
) {
}
