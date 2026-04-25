package com.travelit.backend.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(TripEventType type, UUID tripId, Object payload, UUID actorId) {
        messagingTemplate.convertAndSend(
                "/topic/trips/" + tripId,
                TripEvent.of(type, tripId, payload, actorId)
        );
    }
}
