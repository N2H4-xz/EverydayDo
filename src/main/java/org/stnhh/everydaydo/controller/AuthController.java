package org.stnhh.everydaydo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.auth.AuthResponse;
import org.stnhh.everydaydo.model.dto.auth.LoginRequest;
import org.stnhh.everydaydo.model.dto.auth.RegisterRequest;
import org.stnhh.everydaydo.model.dto.auth.UserProfile;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.security.SecurityUtils;
import org.stnhh.everydaydo.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfile> me() {
        Long userId = SecurityUtils.currentUser().id();
        return ApiResponse.ok(authService.profile(userId));
    }
}
