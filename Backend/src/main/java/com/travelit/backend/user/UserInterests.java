package com.travelit.backend.user;

import java.util.List;
import java.util.stream.Collectors;

/** Interests are stored as a comma-separated string; exposed as a list. */
public final class UserInterests {

    private UserInterests() {}

    public static List<String> parse(String stored) {
        if (stored == null || stored.isBlank()) return List.of();
        return java.util.Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public static String join(List<String> interests) {
        if (interests == null) return null;
        return interests.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.replace(",", " "))
                .distinct()
                .limit(20)
                .collect(Collectors.joining(","));
    }
}
