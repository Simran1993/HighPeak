package com.travelit.backend.notification.dto;

import com.travelit.backend.notification.Notification;
import com.travelit.backend.notification.NotificationType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String message,
        String link,
        UUID actorId,
        String actorName,
        String actorAvatarUrl,
        boolean read,
        OffsetDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        var actor = n.getActor();
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getMessage(),
                n.getLink(),
                actor != null ? actor.getId() : null,
                actor != null ? actor.getName() : null,
                actor != null ? actor.getAvatarUrl() : null,
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
