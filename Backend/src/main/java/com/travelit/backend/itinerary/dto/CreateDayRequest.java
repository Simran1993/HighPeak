package com.travelit.backend.itinerary.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateDayRequest(
        @NotNull LocalDate date,
        String notes
) {}
