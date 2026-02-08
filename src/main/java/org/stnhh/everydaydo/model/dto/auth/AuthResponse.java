package org.stnhh.everydaydo.model.dto.auth;

public record AuthResponse(
        String token,
        UserProfile profile
) {
}
