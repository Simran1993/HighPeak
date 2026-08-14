package com.travelit.backend.ai.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record GeneratedActivity(
        @JsonPropertyDescription("Short activity title, e.g. 'Visit the Louvre'.")
        String title,
        @JsonPropertyDescription("Start time in 24-hour HH:mm format, e.g. '09:30'.")
        String startTime,
        @JsonPropertyDescription("Optional end time in 24-hour HH:mm format. Null if not applicable.")
        String endTime,
        @JsonPropertyDescription("Location or venue name.")
        String location,
        @JsonPropertyDescription("Any useful notes, tips, or booking reminders for this activity.")
        String notes,
        @JsonPropertyDescription("One of: TRANSPORT, ACCOMMODATION, FOOD, SIGHTSEEING, ACTIVITY, SHOPPING, OTHER.")
        String category,
        @JsonPropertyDescription("Estimated cost in the trip's local currency as a plain number. Null if unknown.")
        Double estimatedCost
) {}
