package org.stnhh.everydaydo.model.dto.checkin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateHourlyCheckinRequest(
        @Size(max = 2000) String overallComment,
        @NotEmpty List<@Valid CheckinRecordRequest> records
) {
}
