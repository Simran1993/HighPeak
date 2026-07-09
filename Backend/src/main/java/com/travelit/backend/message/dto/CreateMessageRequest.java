package com.travelit.backend.message.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateMessageRequest(
        @Size(max = 2000) String content,
        UUID attachmentId
) {
}
