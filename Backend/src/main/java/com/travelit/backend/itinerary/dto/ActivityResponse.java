package com.travelit.backend.itinerary.dto;

import com.travelit.backend.itinerary.Activity;
import com.travelit.backend.itinerary.ActivityCategory;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        UUID dayId,
        String title,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        String notes,
        BigDecimal cost,
        ActivityCategory category,
        String bookingLink
) {
    public static ActivityResponse from(Activity activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getDay().getId(),
                activity.getTitle(),
                activity.getStartTime(),
                activity.getEndTime(),
                activity.getLocation(),
                activity.getNotes(),
                activity.getCost(),
                activity.getCategory(),
                activity.getBookingLink()
        );
    }
}
