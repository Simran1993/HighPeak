package com.travelit.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop50ByRecipient_IdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipient_IdAndReadFalse(UUID recipientId);

    Optional<Notification> findByIdAndRecipient_Id(UUID id, UUID recipientId);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipient.id = :recipientId and n.read = false")
    void markAllRead(@Param("recipientId") UUID recipientId);
}
