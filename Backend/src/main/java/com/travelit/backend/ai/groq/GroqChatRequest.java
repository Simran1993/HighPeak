package com.travelit.backend.ai.groq;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroqChatRequest(
        String model,
        List<GroqMessage> messages,
        @JsonProperty("response_format") GroqResponseFormat responseFormat,
        @JsonProperty("max_completion_tokens") Integer maxCompletionTokens,
        Double temperature
) {}
