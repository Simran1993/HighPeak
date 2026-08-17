package com.travelit.backend.ai.dto;

public record GeneratedActivity(
        String title,
        String startTime,
        String endTime,
        String location,
        String notes,
        String category,
        Double estimatedCost
) {}
