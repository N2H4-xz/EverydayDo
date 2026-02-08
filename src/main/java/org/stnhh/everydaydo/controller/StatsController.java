package org.stnhh.everydaydo.controller;

import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.model.dto.stats.CompletionSummaryResponse;
import org.stnhh.everydaydo.model.enums.SummaryPeriod;
import org.stnhh.everydaydo.security.SecurityUtils;
import org.stnhh.everydaydo.service.StatsService;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/completion")
    public ApiResponse<CompletionSummaryResponse> completion(
            @RequestParam SummaryPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate referenceDate
    ) {
        Long userId = SecurityUtils.currentUser().id();
        LocalDate date = referenceDate == null ? LocalDate.now() : referenceDate;
        return ApiResponse.ok(statsService.completionSummary(userId, period, date));
    }
}
