package com.travelit.backend.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record GenerateItineraryRequest(
        @NotBlank @Size(max = 4000) String prompt,
        List<String> preferences,
        @Positive Integer travelers,
        String budgetLevel
) {}
