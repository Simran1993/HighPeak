package com.travelit.backend.websocket;

import java.time.Instant;
import java.util.UUID;

public record TripEvent(
        TripEventType type,
        UUID tripId,
        Object payload,
        UUID actorId,
        Instant timestamp
) {
    public static TripEvent of(TripEventType type, UUID tripId, Object payload, UUID actorId) {
        return new TripEvent(type, tripId, payload, actorId, Instant.now());
    }
}
