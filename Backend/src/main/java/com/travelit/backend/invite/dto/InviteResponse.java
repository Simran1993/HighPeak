package com.travelit.backend.invite.dto;

import com.travelit.backend.invite.InviteStatus;
import com.travelit.backend.invite.TripInvite;

import java.time.OffsetDateTime;
import java.util.UUID;

public record InviteResponse(
        UUID id,
        UUID tripId,
        String tripTitle,
        String invitedEmail,
        String invitedByName,
        InviteStatus status,
        OffsetDateTime expiresAt,
        OffsetDateTime createdAt
) {
    public static InviteResponse from(TripInvite invite) {
        return new InviteResponse(
                invite.getId(),
                invite.getTrip().getId(),
                invite.getTrip().getTitle(),
                invite.getInvitedEmail(),
                invite.getInvitedBy().getName(),
                invite.getStatus(),
                invite.getExpiresAt(),
                invite.getCreatedAt()
        );
    }
}
