package com.travelit.backend.post.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePostRequest(
        @NotNull(message = "tripId is required")
        UUID tripId,

        @Size(max = 2000, message = "Caption must be at most 2000 characters")
        String caption,

        String coverImageUrl
) {}
