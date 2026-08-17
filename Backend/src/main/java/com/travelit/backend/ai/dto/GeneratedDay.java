package com.travelit.backend.ai.dto;

import java.util.List;

public record GeneratedDay(
        int dayNumber,
        String date,
        String theme,
        List<GeneratedActivity> activities
) {}
