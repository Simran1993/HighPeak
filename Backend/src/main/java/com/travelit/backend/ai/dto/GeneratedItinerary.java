package com.travelit.backend.ai.dto;

import java.util.List;

/** Shape of the itinerary JSON the AI model returns — parsed directly from the model response. */
public record GeneratedItinerary(
        String summary,
        List<GeneratedDay> days
) {}
