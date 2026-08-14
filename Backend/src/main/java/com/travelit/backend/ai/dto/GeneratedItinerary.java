package com.travelit.backend.ai.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import java.util.List;

/** Shape of the structured JSON Claude returns — parsed directly from the model response. */
public record GeneratedItinerary(
        @JsonPropertyDescription("A 1-2 sentence summary of the overall trip plan.")
        String summary,
        @JsonPropertyDescription("One entry per day of the trip, in chronological order.")
        List<GeneratedDay> days
) {}
