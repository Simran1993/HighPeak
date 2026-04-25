package com.travelit.backend.itinerary.dto;

import com.travelit.backend.itinerary.Activity;
import com.travelit.backend.itinerary.ItineraryDay;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DayResponse(
        UUID id,
        UUID tripId,
        LocalDate date,
        String notes,
        List<ActivityResponse> activities
) {
    public static DayResponse from(ItineraryDay day, List<Activity> activities) {
        return new DayResponse(
                day.getId(),
                day.getTrip().getId(),
                day.getDate(),
                day.getNotes(),
                activities.stream().map(ActivityResponse::from).toList()
        );
    }
}
