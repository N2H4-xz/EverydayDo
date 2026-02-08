package org.stnhh.everydaydo.model.dto.stats;

import java.time.LocalDate;
import org.stnhh.everydaydo.model.enums.SummaryPeriod;

public record CompletionSummaryResponse(
        SummaryPeriod period,
        LocalDate startDate,
        LocalDate endDate,
        Integer totalTasks,
        Integer completedTasks,
        Integer adHocTasks,
        Integer plannedMinutes,
        Integer completedMinutes,
        Double taskCompletionRate,
        Double minuteCompletionRate
) {
}
