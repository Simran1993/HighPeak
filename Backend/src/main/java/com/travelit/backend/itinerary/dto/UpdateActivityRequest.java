package com.travelit.backend.itinerary.dto;

import com.travelit.backend.itinerary.ActivityCategory;

import java.math.BigDecimal;
import java.time.LocalTime;

public record UpdateActivityRequest(
        String title,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        String notes,
        BigDecimal cost,
        ActivityCategory category,
        String bookingLink
) {}
