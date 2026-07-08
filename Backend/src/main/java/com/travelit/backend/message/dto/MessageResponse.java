package com.travelit.backend.message.dto;

import com.travelit.backend.message.Message;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID tripId,
        UUID userId,
        String authorName,
        String authorAvatarUrl,
        String content,
        OffsetDateTime createdAt
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getTrip().getId(),
                message.getAuthor().getId(),
                message.getAuthor().getName(),
                message.getAuthor().getAvatarUrl(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
