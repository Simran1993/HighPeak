package com.travelit.backend.trip.dto;

import com.travelit.backend.trip.MemberRole;
import com.travelit.backend.trip.TripMember;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TripMemberResponse(
        UUID userId,
        String name,
        String email,
        String avatarUrl,
        MemberRole role,
        OffsetDateTime joinedAt
) {
    public static TripMemberResponse from(TripMember member) {
        return new TripMemberResponse(
                member.getUser().getId(),
                member.getUser().getName(),
                member.getUser().getEmail(),
                member.getUser().getAvatarUrl(),
                member.getRole(),
                member.getJoinedAt()
        );
    }
}
