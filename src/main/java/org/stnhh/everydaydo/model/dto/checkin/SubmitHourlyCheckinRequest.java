package org.stnhh.everydaydo.model.dto.checkin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public record SubmitHourlyCheckinRequest(
        @NotNull LocalDateTime windowStart,
        @NotNull LocalDateTime windowEnd,
        @Size(max = 2000) String overallComment,
        @NotEmpty List<@Valid CheckinRecordRequest> records
) {
}
