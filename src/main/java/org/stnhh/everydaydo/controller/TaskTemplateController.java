package org.stnhh.everydaydo.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.model.dto.task.CreateTemplateRequest;
import org.stnhh.everydaydo.model.dto.task.TaskTemplateResponse;
import org.stnhh.everydaydo.model.dto.task.UpdateTemplateRequest;
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

    @PutMapping("/{templateId}")
    public ApiResponse<TaskTemplateResponse> update(
            @PathVariable Long templateId,
            @Valid @RequestBody UpdateTemplateRequest request
    ) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(taskTemplateService.update(userId, templateId, request));
    }

    @PatchMapping("/{templateId}/enabled")
    public ApiResponse<TaskTemplateResponse> setEnabled(
            @PathVariable Long templateId,
            @RequestParam Boolean enabled
    ) {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(taskTemplateService.setEnabled(userId, templateId, enabled));
    }

    @DeleteMapping("/{templateId}")
    public ApiResponse<Boolean> delete(@PathVariable Long templateId) {
        Long userId = SecurityUtils.currentUser().id();
        taskTemplateService.delete(userId, templateId);
        return ApiResponse.ok(true);
    }
}
