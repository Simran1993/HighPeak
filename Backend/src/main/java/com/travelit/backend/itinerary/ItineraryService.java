package com.travelit.backend.itinerary;

import com.travelit.backend.itinerary.dto.*;
import com.travelit.backend.trip.MemberRole;
import com.travelit.backend.trip.TripMember;
import com.travelit.backend.trip.TripMemberRepository;
import com.travelit.backend.trip.TripRepository;
import com.travelit.backend.websocket.TripEventPublisher;
import com.travelit.backend.websocket.TripEventType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItineraryService {

    private final ItineraryDayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripEventPublisher eventPublisher;

    public List<DayResponse> getItinerary(UUID tripId, UUID userId) {
        validateMember(tripId, userId);
        return dayRepository.findByTrip_IdOrderByDateAsc(tripId).stream()
                .map(day -> DayResponse.from(day, activityRepository.findByDay_IdOrderByStartTimeAsc(day.getId())))
                .toList();
    }

    @Transactional
    public DayResponse addDay(UUID tripId, CreateDayRequest request, UUID userId) {
        validateEditor(tripId, userId);
        var trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));

        if (dayRepository.existsByTrip_IdAndDate(tripId, request.date())) {
            throw new IllegalStateException("A day already exists for " + request.date());
        }

        ItineraryDay day = ItineraryDay.builder()
                .trip(trip)
                .date(request.date())
                .notes(request.notes())
                .build();
        DayResponse response = DayResponse.from(dayRepository.save(day), List.of());
        eventPublisher.publish(TripEventType.DAY_ADDED, tripId, response, userId);
        return response;
    }

    @Transactional
    public void deleteDay(UUID tripId, UUID dayId, UUID userId) {
        validateEditor(tripId, userId);
        ItineraryDay day = findDayOrThrow(tripId, dayId);
        dayRepository.delete(day);
        eventPublisher.publish(TripEventType.DAY_DELETED, tripId, Map.of("dayId", dayId), userId);
    }

    @Transactional
    public ActivityResponse addActivity(UUID tripId, UUID dayId, CreateActivityRequest request, UUID userId) {
        validateEditor(tripId, userId);
        ItineraryDay day = findDayOrThrow(tripId, dayId);

        Activity activity = Activity.builder()
                .day(day)
                .title(request.title())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .location(request.location())
                .notes(request.notes())
                .cost(request.cost())
                .category(request.category())
                .bookingLink(request.bookingLink())
                .build();
        ActivityResponse response = ActivityResponse.from(activityRepository.save(activity));
        eventPublisher.publish(TripEventType.ACTIVITY_ADDED, tripId, response, userId);
        return response;
    }

    @Transactional
    public ActivityResponse updateActivity(UUID tripId, UUID dayId, UUID activityId,
                                           UpdateActivityRequest request, UUID userId) {
        validateEditor(tripId, userId);
        findDayOrThrow(tripId, dayId);
        Activity activity = findActivityOrThrow(dayId, activityId);

        if (request.title() != null)       activity.setTitle(request.title());
        if (request.startTime() != null)   activity.setStartTime(request.startTime());
        if (request.endTime() != null)     activity.setEndTime(request.endTime());
        if (request.location() != null)    activity.setLocation(request.location());
        if (request.notes() != null)       activity.setNotes(request.notes());
        if (request.cost() != null)        activity.setCost(request.cost());
        if (request.category() != null)    activity.setCategory(request.category());
        if (request.bookingLink() != null) activity.setBookingLink(request.bookingLink());

        ActivityResponse response = ActivityResponse.from(activityRepository.save(activity));
        eventPublisher.publish(TripEventType.ACTIVITY_UPDATED, tripId, response, userId);
        return response;
    }

    @Transactional
    public void deleteActivity(UUID tripId, UUID dayId, UUID activityId, UUID userId) {
        validateEditor(tripId, userId);
        findDayOrThrow(tripId, dayId);
        activityRepository.delete(findActivityOrThrow(dayId, activityId));
        eventPublisher.publish(TripEventType.ACTIVITY_DELETED, tripId,
                Map.of("activityId", activityId, "dayId", dayId), userId);
    }

    private void validateMember(UUID tripId, UUID userId) {
        tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
    }

    private void validateEditor(UUID tripId, UUID userId) {
        TripMember member = tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
        if (member.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot modify the itinerary");
        }
    }

    private ItineraryDay findDayOrThrow(UUID tripId, UUID dayId) {
        ItineraryDay day = dayRepository.findById(dayId)
                .orElseThrow(() -> new EntityNotFoundException("Day not found"));
        if (!day.getTrip().getId().equals(tripId)) {
            throw new EntityNotFoundException("Day not found");
        }
        return day;
    }

    private Activity findActivityOrThrow(UUID dayId, UUID activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found"));
        if (!activity.getDay().getId().equals(dayId)) {
            throw new EntityNotFoundException("Activity not found");
        }
        return activity;
    }
}
