package org.stnhh.everydaydo.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.checkin.HourlyCheckinResponse;
import org.stnhh.everydaydo.model.dto.checkin.PendingWindowCheckinResponse;
import org.stnhh.everydaydo.model.dto.checkin.SubmitHourlyCheckinRequest;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.model.dto.task.TaskInstanceResponse;
import org.stnhh.everydaydo.security.SecurityUtils;
import org.stnhh.everydaydo.service.HourlyCheckinService;

@RestController
@RequestMapping("/api/checkins/hourly")
@RequiredArgsConstructor
public class HourlyCheckinController {

    private final HourlyCheckinService hourlyCheckinService;

    @PostMapping
    public ApiResponse<HourlyCheckinResponse> submit(@Valid @RequestBody SubmitHourlyCheckinRequest request) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(hourlyCheckinService.submit(userId, request));
    }

    @GetMapping
    public ApiResponse<List<HourlyCheckinResponse>> listByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(hourlyCheckinService.listByDate(userId, date));
    }

    @GetMapping("/window-tasks")
    public ApiResponse<List<TaskInstanceResponse>> listWindowTasks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime windowStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime windowEnd
    ) {
        Long userId = SecurityUtils.currentUser().id();
        List<TaskInstanceResponse> data = hourlyCheckinService.listWindowPlannedTaskResponses(userId, windowStart, windowEnd);
        return ApiResponse.ok(data);
    }

    @GetMapping("/pending")
    public ApiResponse<PendingWindowCheckinResponse> pendingWindow(
            @RequestParam(defaultValue = "60") Integer windowMinutes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime referenceTime
    ) {
        Long userId = SecurityUtils.currentUser().id();
        LocalDateTime now = referenceTime == null ? LocalDateTime.now() : referenceTime;
        return ApiResponse.ok(hourlyCheckinService.previousWindowPrompt(userId, now, windowMinutes));
    }
}
