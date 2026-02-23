package org.stnhh.everydaydo.model.dto.holiday;

import java.time.LocalDate;

public record HolidayDayResponse(
        LocalDate holidayDate,
        boolean holiday,
        String name,
        boolean customized
) {
}
