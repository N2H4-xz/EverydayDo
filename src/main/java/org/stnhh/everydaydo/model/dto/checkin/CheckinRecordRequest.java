package org.stnhh.everydaydo.model.dto.checkin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record CheckinRecordRequest(
        Long taskInstanceId,
        @Size(max = 128) String title,
        @Min(1) @Max(720) Integer completedMinutes,
        @Size(max = 2000) String comment,
        @Size(max = 500) String referenceLink
) {
}
