package com.travelit.backend.itinerary.dto;

import com.travelit.backend.itinerary.ActivityCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalTime;

public record CreateActivityRequest(
        @NotBlank String title,
        @NotNull LocalTime startTime,
        @NotBlank String location,
        @NotBlank String notes,
        BigDecimal cost,
        ActivityCategory category,
        String bookingLink
) {}
