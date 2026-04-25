package com.travelit.backend.trip.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateTripRequest(
        @Size(max = 255) String title,
        String description,
        String destination,
        LocalDate startDate,
        LocalDate endDate
) {}
