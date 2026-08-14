package com.travelit.backend.ai.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import java.util.List;

public record GeneratedDay(
        @JsonPropertyDescription("1-indexed day number within the trip, e.g. 1 for the first day.")
        int dayNumber,
        @JsonPropertyDescription("Date for this day in ISO-8601 format (YYYY-MM-DD).")
        String date,
        @JsonPropertyDescription("Short theme or title for the day, e.g. 'Old Town & Museums'.")
        String theme,
        @JsonPropertyDescription("Activities for this day, ordered by start time.")
        List<GeneratedActivity> activities
) {}
