package com.travelit.backend.notification;

import com.travelit.backend.notification.dto.NotificationResponse;
import com.travelit.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Persist a notification for {@code recipient} and push it live over the
     * recipient's private WebSocket queue (/user/queue/notifications).
     * No-op when there is no recipient, or when the actor is the recipient
     * (you don't get notified about your own actions).
     */
    @Transactional
    public void notify(User recipient, User actor, NotificationType type, String message, String link) {
        if (recipient == null) return;
        if (actor != null && actor.getId().equals(recipient.getId())) return;

        Notification saved = notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .message(message)
                .link(link)
                .read(false)
                .build());

        messagingTemplate.convertAndSendToUser(
                recipient.getId().toString(),
                "/queue/notifications",
                NotificationResponse.from(saved));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        return notificationRepository.findTop50ByRecipient_IdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByRecipient_IdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(UUID id, UUID userId) {
        notificationRepository.findByIdAndRecipient_Id(id, userId)
                .ifPresent(n -> n.setRead(true));
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllRead(userId);
    }
}
