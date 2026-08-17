package com.travelit.backend.ai.groq;

/** One turn in a Groq (OpenAI-compatible) chat completion request or response. */
public record GroqMessage(String role, String content) {

    public static GroqMessage system(String content) {
        return new GroqMessage("system", content);
    }

    public static GroqMessage user(String content) {
        return new GroqMessage("user", content);
    }
}
