package org.stnhh.everydaydo.model.dto.checkin;

import java.time.LocalDateTime;
import java.util.List;

public record HourlyCheckinResponse(
        Long checkinId,
        LocalDateTime windowStart,
        LocalDateTime windowEnd,
        String overallComment,
        List<CheckinRecordResponse> records
) {
}
