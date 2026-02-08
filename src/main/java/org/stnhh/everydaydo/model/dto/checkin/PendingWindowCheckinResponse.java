package org.stnhh.everydaydo.model.dto.checkin;

import java.time.LocalDateTime;
import java.util.List;
import org.stnhh.everydaydo.model.dto.task.TaskInstanceResponse;

public record PendingWindowCheckinResponse(
        LocalDateTime windowStart,
        LocalDateTime windowEnd,
        Integer windowMinutes,
        boolean submitted,
        String prompt,
        List<TaskInstanceResponse> plannedTasks
) {
}
