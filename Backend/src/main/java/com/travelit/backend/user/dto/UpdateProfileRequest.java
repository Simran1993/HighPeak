package com.travelit.backend.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @Size(max = 1000, message = "Bio must be at most 1000 characters")
        String bio,

        String avatarUrl
) {}
