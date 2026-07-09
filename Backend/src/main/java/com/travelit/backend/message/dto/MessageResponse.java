package com.travelit.backend.message.dto;

import com.travelit.backend.file.StoredFile;
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
        UUID attachmentId,
        String attachmentName,
        String attachmentType,
        Long attachmentSize,
        OffsetDateTime createdAt
) {
    public static MessageResponse from(Message message) {
        StoredFile att = message.getAttachment();
        return new MessageResponse(
                message.getId(),
                message.getTrip().getId(),
                message.getAuthor().getId(),
                message.getAuthor().getName(),
                message.getAuthor().getAvatarUrl(),
                message.getContent(),
                att != null ? att.getId() : null,
                att != null ? att.getFilename() : null,
                att != null ? att.getContentType() : null,
                att != null ? att.getSizeBytes() : null,
                message.getCreatedAt()
        );
    }
}
