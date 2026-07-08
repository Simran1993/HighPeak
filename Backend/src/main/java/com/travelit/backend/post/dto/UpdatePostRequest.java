package com.travelit.backend.post.dto;

import jakarta.validation.constraints.Size;

public record UpdatePostRequest(
        @Size(max = 2000, message = "Caption must be at most 2000 characters")
        String caption,

        String coverImageUrl
) {}
