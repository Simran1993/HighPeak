package com.travelit.backend.trip.dto;

import com.travelit.backend.trip.MemberRole;
import com.travelit.backend.trip.Trip;
import com.travelit.backend.trip.TripStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TripResponse(
        UUID id,
        String title,
        String description,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        TripStatus status,
        MemberRole myRole,
        int memberCount,
        UUID createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static TripResponse from(Trip trip, MemberRole myRole) {
        return new TripResponse(
                trip.getId(),
                trip.getTitle(),
                trip.getDescription(),
                trip.getDestination(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getStatus(),
                myRole,
                trip.getMembers().size(),
                trip.getCreatedBy().getId(),
                trip.getCreatedAt(),
                trip.getUpdatedAt()
        );
    }
}
