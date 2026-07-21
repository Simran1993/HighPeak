package com.travelit.backend.user.dto;

import com.travelit.backend.user.User;
import com.travelit.backend.user.UserInterests;

import java.util.List;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Public view of a user — no email or auth details. */
public record ProfileResponse(
        UUID id,
        String name,
        String avatarUrl,
        String bio,
        List<String> interests,
        OffsetDateTime joinedAt
) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(
                user.getId(),
                user.getName(),
                user.getAvatarUrl(),
                user.getBio(),
                UserInterests.parse(user.getInterests()),
                user.getCreatedAt()
        );
    }
}
