package com.travelit.backend.ai.groq;

public record GroqResponseFormat(String type) {
    public static final GroqResponseFormat JSON_OBJECT = new GroqResponseFormat("json_object");
}
