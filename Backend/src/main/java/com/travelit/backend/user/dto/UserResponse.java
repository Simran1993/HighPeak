package com.travelit.backend.user.dto;

import com.travelit.backend.user.AuthProvider;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserInterests;

import java.util.List;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        String avatarUrl,
        String bio,
        List<String> interests,
        AuthProvider authProvider,
        boolean emailVerified
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getBio(),
                UserInterests.parse(user.getInterests()),
                user.getAuthProvider(),
                user.isEmailVerified()
        );
    }
}
