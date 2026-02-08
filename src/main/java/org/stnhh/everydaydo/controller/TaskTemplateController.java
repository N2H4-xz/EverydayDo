package org.stnhh.everydaydo.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.model.dto.task.CreateTemplateRequest;
import org.stnhh.everydaydo.model.dto.task.TaskTemplateResponse;
import org.stnhh.everydaydo.security.SecurityUtils;
import org.stnhh.everydaydo.service.TaskTemplateService;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TaskTemplateController {

    private final TaskTemplateService taskTemplateService;

    @PostMapping
    public ApiResponse<TaskTemplateResponse> create(@Valid @RequestBody CreateTemplateRequest request) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(taskTemplateService.create(userId, request));
    }

    @GetMapping
    public ApiResponse<List<TaskTemplateResponse>> list() {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(taskTemplateService.listByUser(userId));
    }
}
