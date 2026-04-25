package com.travelit.backend.trip.dto;

import com.travelit.backend.trip.MemberRole;
import com.travelit.backend.trip.TripMember;
import com.travelit.backend.trip.TripStatus;

import java.time.LocalDate;
import java.util.UUID;

public record TripSummaryResponse(
        UUID id,
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        TripStatus status,
        MemberRole myRole
) {
    public static TripSummaryResponse from(TripMember member) {
        return new TripSummaryResponse(
                member.getTrip().getId(),
                member.getTrip().getTitle(),
                member.getTrip().getDestination(),
                member.getTrip().getStartDate(),
                member.getTrip().getEndDate(),
                member.getTrip().getStatus(),
                member.getRole()
        );
    }
}
