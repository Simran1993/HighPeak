package com.travelit.backend.ai;

/** Thrown when Claude fails to produce a usable itinerary (network/API failure, refusal, or empty result). */
public class AiGenerationException extends RuntimeException {

    public AiGenerationException(String message) {
        super(message);
    }

    public AiGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
