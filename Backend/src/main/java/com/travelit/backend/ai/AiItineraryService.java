package com.travelit.backend.ai;

import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import com.travelit.backend.ai.dto.GenerateItineraryRequest;
import com.travelit.backend.ai.dto.GeneratedActivity;
import com.travelit.backend.ai.dto.GeneratedDay;
import com.travelit.backend.ai.dto.GeneratedItinerary;
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
            traveler's request says otherwise. Respond only with the structured itinerary.""";

    private final AnthropicClient anthropicClient;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ItineraryDayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final TripEventPublisher eventPublisher;

    @Value("${app.ai.model:claude-opus-5}")
    private String model;

    @Transactional
    public List<DayResponse> generateItinerary(UUID tripId, GenerateItineraryRequest request, UUID userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        validateEditor(tripId, userId);

        GeneratedItinerary generated = requestItineraryFromClaude(trip, request);
        if (generated.days() == null || generated.days().isEmpty()) {
            throw new AiGenerationException("Claude did not return any itinerary days");
        }

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

    private GeneratedItinerary requestItineraryFromClaude(Trip trip, GenerateItineraryRequest request) {
        StructuredMessageCreateParams<GeneratedItinerary> params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(8000L)
                .system(SYSTEM_PROMPT)
                .outputConfig(GeneratedItinerary.class)
                .addUserMessage(buildUserPrompt(trip, request))
                .build();

        try {
            var response = anthropicClient.messages().create(params);
            return response.content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(typed -> typed.text())
                    .findFirst()
                    .orElseThrow(() -> new AiGenerationException(
                            "Claude did not return a structured itinerary — the request may have been declined"));
        } catch (AiGenerationException e) {
            throw e;
        } catch (RuntimeException e) {
            log.error("Anthropic itinerary generation failed", e);
            throw new AiGenerationException("Failed to reach Claude to generate the itinerary", e);
        }
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
        throw new AiGenerationException("Claude returned a day with no usable date (day " + genDay.dayNumber() + ")");
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
