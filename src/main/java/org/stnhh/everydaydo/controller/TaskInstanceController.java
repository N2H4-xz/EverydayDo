package org.stnhh.everydaydo.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.model.dto.task.CreateManualTaskRequest;
import org.stnhh.everydaydo.model.dto.task.TaskInstanceResponse;
import org.stnhh.everydaydo.security.SecurityUtils;
import org.stnhh.everydaydo.service.TaskInstanceService;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskInstanceController {

    private final TaskInstanceService taskInstanceService;

    @PostMapping("/manual")
    public ApiResponse<TaskInstanceResponse> createManual(@Valid @RequestBody CreateManualTaskRequest request) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(taskInstanceService.createManual(userId, request));
    }

    @GetMapping
    public ApiResponse<List<TaskInstanceResponse>> listByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(taskInstanceService.listByDate(userId, date));
    }
}
