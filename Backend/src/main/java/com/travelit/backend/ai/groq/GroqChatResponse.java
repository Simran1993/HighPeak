package com.travelit.backend.ai.groq;

import java.util.List;

public record GroqChatResponse(List<GroqChoice> choices) {}
