package org.stnhh.everydaydo.model.dto.auth;

public record UserProfile(
        Long id,
        String username,
        String email
) {
}
