package com.travelit.backend.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelit.backend.ai.dto.GenerateItineraryRequest;
import com.travelit.backend.ai.dto.GeneratedActivity;
import com.travelit.backend.ai.dto.GeneratedDay;
import com.travelit.backend.ai.dto.GeneratedItinerary;
import com.travelit.backend.ai.groq.GroqChatRequest;
import com.travelit.backend.ai.groq.GroqChatResponse;
import com.travelit.backend.ai.groq.GroqMessage;
import com.travelit.backend.ai.groq.GroqResponseFormat;
import com.travelit.backend.itinerary.Activity;
import com.travelit.backend.itinerary.ActivityCategory;
import com.travelit.backend.itinerary.ActivityRepository;
import com.travelit.backend.itinerary.ItineraryDay;
import com.travelit.backend.itinerary.ItineraryDayRepository;
import com.travelit.backend.itinerary.dto.DayResponse;
import com.travelit.backend.trip.MemberRole;
import com.travelit.backend.trip.Trip;
import com.travelit.backend.trip.TripMember;
import com.travelit.backend.trip.TripMemberRepository;
import com.travelit.backend.trip.TripRepository;
import com.travelit.backend.websocket.TripEventPublisher;
import com.travelit.backend.websocket.TripEventType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiItineraryService {

    private static final Logger log = LoggerFactory.getLogger(AiItineraryService.class);

    private static final String SYSTEM_PROMPT = """
            You are an expert travel planner working inside a trip-planning app. Given trip \
            details and a traveler's request, produce a realistic, well-paced, day-by-day \
            itinerary. Keep travel times sensible for the destination, avoid overlapping \
            activities on the same day, and order each day's activities by start time. Every \
            day in the trip's date range should have at least one activity unless the \
            traveler's request says otherwise.

            Respond with a single JSON object only — no markdown, no code fences, no \
            commentary before or after it — matching exactly this shape:
            {
              "summary": "1-2 sentence summary of the overall trip plan",
              "days": [
                {
                  "dayNumber": 1,
                  "date": "YYYY-MM-DD",
                  "theme": "short theme or title for the day",
                  "activities": [
                    {
                      "title": "short activity title",
                      "startTime": "HH:mm in 24-hour time",
                      "endTime": "HH:mm in 24-hour time, or null if not applicable",
                      "location": "location or venue name",
                      "notes": "useful notes, tips, or booking reminders",
                      "category": "one of TRANSPORT, ACCOMMODATION, FOOD, SIGHTSEEING, ACTIVITY, SHOPPING, OTHER",
                      "estimatedCost": 0.0
                    }
                  ]
                }
              ]
            }""";

    private final RestClient groqRestClient;
    private final ObjectMapper objectMapper;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ItineraryDayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final TripEventPublisher eventPublisher;

    @Value("${app.ai.model:openai/gpt-oss-120b}")
    private String model;

    /**
     * Step 1 — propose an itinerary from the prompt WITHOUT saving anything.
     * The user reviews this and confirms before it's committed via {@link #apply}.
     */
    @Transactional(readOnly = true)
    public GeneratedItinerary suggest(UUID tripId, GenerateItineraryRequest request, UUID userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        validateEditor(tripId, userId);

        GeneratedItinerary generated = requestItineraryFromGroq(trip, request);
        if (generated.days() == null || generated.days().isEmpty()) {
            throw new AiGenerationException("Groq did not return any itinerary days");
        }
        return generated;
    }

    /**
     * Step 2 — persist a proposal the user has reviewed and confirmed. This is the
     * only path that writes AI-generated content to the trip.
     */
    @Transactional
    public List<DayResponse> apply(UUID tripId, GeneratedItinerary proposal, UUID userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        validateEditor(tripId, userId);
        if (proposal == null || proposal.days() == null || proposal.days().isEmpty()) {
            throw new AiGenerationException("There is no itinerary to add");
        }
        return persist(trip, proposal, tripId, userId);
    }

    /** One-shot generate + persist (kept for backward compatibility). */
    @Transactional
    public List<DayResponse> generateItinerary(UUID tripId, GenerateItineraryRequest request, UUID userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        validateEditor(tripId, userId);

        GeneratedItinerary generated = requestItineraryFromGroq(trip, request);
        if (generated.days() == null || generated.days().isEmpty()) {
            throw new AiGenerationException("Groq did not return any itinerary days");
        }
        return persist(trip, generated, tripId, userId);
    }

    private List<DayResponse> persist(Trip trip, GeneratedItinerary generated, UUID tripId, UUID userId) {
        for (GeneratedDay genDay : generated.days()) {
            LocalDate date = resolveDate(trip, genDay);
            ItineraryDay day = dayRepository.findByTrip_IdAndDate(tripId, date)
                    .orElseGet(() -> dayRepository.save(ItineraryDay.builder()
                            .trip(trip)
                            .date(date)
                            .notes(genDay.theme())
                            .build()));

            List<GeneratedActivity> activities = genDay.activities() == null ? List.of() : genDay.activities();
            for (GeneratedActivity genActivity : activities) {
                Activity activity = Activity.builder()
                        .day(day)
                        .title(genActivity.title())
                        .startTime(parseTime(genActivity.startTime()))
                        .endTime(parseTime(genActivity.endTime()))
                        .location(genActivity.location())
                        .notes(genActivity.notes())
                        .cost(parseCost(genActivity.estimatedCost()))
                        .category(parseCategory(genActivity.category()))
                        .build();
                activityRepository.save(activity);
            }
        }

        List<DayResponse> response = dayRepository.findByTrip_IdOrderByDateAsc(tripId).stream()
                .map(day -> DayResponse.from(day, activityRepository.findByDay_IdOrderByStartTimeAsc(day.getId())))
                .toList();
        eventPublisher.publish(TripEventType.AI_ITINERARY_GENERATED, tripId, response, userId);
        return response;
    }

    private GeneratedItinerary requestItineraryFromGroq(Trip trip, GenerateItineraryRequest request) {
        GroqChatRequest chatRequest = new GroqChatRequest(
                model,
                List.of(GroqMessage.system(SYSTEM_PROMPT), GroqMessage.user(buildUserPrompt(trip, request))),
                GroqResponseFormat.JSON_OBJECT,
                8000,
                0.4
        );

        GroqChatResponse response;
        try {
            response = groqRestClient.post()
                    .uri("/chat/completions")
                    .body(chatRequest)
                    .retrieve()
                    .body(GroqChatResponse.class);
        } catch (RestClientResponseException e) {
            log.error("Groq itinerary generation failed: {} {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new AiGenerationException("Failed to reach Groq to generate the itinerary", e);
        } catch (RestClientException e) {
            log.error("Groq itinerary generation failed", e);
            throw new AiGenerationException("Failed to reach Groq to generate the itinerary", e);
        }

        String content = response == null ? null : response.choices().stream()
                .findFirst()
                .map(choice -> choice.message().content())
                .orElse(null);
        if (!StringUtils.hasText(content)) {
            throw new AiGenerationException(
                    "Groq did not return a structured itinerary — the request may have been declined or rate-limited");
        }

        try {
            return objectMapper.readValue(stripCodeFence(content), GeneratedItinerary.class);
        } catch (JsonProcessingException e) {
            log.error("Groq returned unparseable itinerary JSON: {}", content, e);
            throw new AiGenerationException("Groq returned a response that couldn't be parsed as a structured itinerary");
        }
    }

    /** Defensive cleanup in case the model wraps its JSON in a ```json code fence despite instructions. */
    private String stripCodeFence(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*\\s*", "");
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    private String buildUserPrompt(Trip trip, GenerateItineraryRequest request) {
        StringBuilder sb = new StringBuilder("Plan an itinerary for the following trip:\n");
        sb.append("- Trip title: ").append(trip.getTitle()).append('\n');
        if (StringUtils.hasText(trip.getDestination())) {
            sb.append("- Destination: ").append(trip.getDestination()).append('\n');
        }
        if (trip.getStartDate() != null && trip.getEndDate() != null) {
            long days = ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
            sb.append("- Dates: ").append(trip.getStartDate()).append(" to ").append(trip.getEndDate())
                    .append(" (").append(days).append(" day(s)); use dayNumber 1 for ")
                    .append(trip.getStartDate()).append(" and set each day's date field accordingly.\n");
        } else {
            sb.append("- Dates are not set yet; number the days starting at 1 and estimate ISO dates ")
                    .append("starting from today.\n");
        }
        if (request.travelers() != null) {
            sb.append("- Travelers: ").append(request.travelers()).append('\n');
        }
        if (StringUtils.hasText(request.budgetLevel())) {
            sb.append("- Budget level: ").append(request.budgetLevel()).append('\n');
        }
        if (request.preferences() != null && !request.preferences().isEmpty()) {
            sb.append("- Preferences/interests: ").append(String.join(", ", request.preferences())).append('\n');
        }
        sb.append("\nTraveler's request: ").append(request.prompt());
        return sb.toString();
    }

    private LocalDate resolveDate(Trip trip, GeneratedDay genDay) {
        if (trip.getStartDate() != null && genDay.dayNumber() > 0) {
            return trip.getStartDate().plusDays(genDay.dayNumber() - 1L);
        }
        if (StringUtils.hasText(genDay.date())) {
            try {
                return LocalDate.parse(genDay.date().trim());
            } catch (DateTimeParseException ignored) {
                // fall through to error below
            }
        }
        throw new AiGenerationException("Groq returned a day with no usable date (day " + genDay.dayNumber() + ")");
    }

    private LocalTime parseTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        try {
            return LocalTime.parse(trimmed);
        } catch (DateTimeParseException e) {
            try {
                return LocalTime.parse(trimmed, DateTimeFormatter.ofPattern("H:mm"));
            } catch (DateTimeParseException e2) {
                log.warn("Could not parse activity time '{}', leaving blank", value);
                return null;
            }
        }
    }

    private BigDecimal parseCost(Double value) {
        return value == null ? null : BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private ActivityCategory parseCategory(String value) {
        if (!StringUtils.hasText(value)) {
            return ActivityCategory.OTHER;
        }
        try {
            return ActivityCategory.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ActivityCategory.OTHER;
        }
    }

    private void validateEditor(UUID tripId, UUID userId) {
        TripMember member = tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
        if (member.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot generate an itinerary");
        }
    }
}
