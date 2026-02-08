package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.stnhh.everydaydo.mapper.UserMapper;
import org.stnhh.everydaydo.model.dto.auth.AuthResponse;
import org.stnhh.everydaydo.model.dto.auth.LoginRequest;
import org.stnhh.everydaydo.model.dto.auth.RegisterRequest;
import org.stnhh.everydaydo.model.dto.auth.UserProfile;
import org.stnhh.everydaydo.model.entity.UserEntity;
import org.stnhh.everydaydo.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        boolean exists = userMapper.exists(new LambdaQueryWrapper<UserEntity>()
                .eq(UserEntity::getUsername, request.username())
                .or().eq(UserEntity::getEmail, request.email()));
        if (exists) {
            throw new IllegalArgumentException("Username or email already exists");
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);

        String token = jwtService.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, toProfile(user));
    }

    public AuthResponse login(LoginRequest request) {
        UserEntity user = userMapper.selectOne(new LambdaQueryWrapper<UserEntity>()
                .eq(UserEntity::getUsername, request.account())
                .or().eq(UserEntity::getEmail, request.account()));
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid account or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, toProfile(user));
    }

    public UserProfile profile(Long userId) {
        UserEntity user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return toProfile(user);
    }

    private UserProfile toProfile(UserEntity user) {
        return new UserProfile(user.getId(), user.getUsername(), user.getEmail());
    }
}
