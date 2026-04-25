package com.travelit.backend.itinerary;

import com.travelit.backend.itinerary.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips/{tripId}/itinerary")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @GetMapping
    public ResponseEntity<List<DayResponse>> getItinerary(@PathVariable UUID tripId,
                                                          @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(itineraryService.getItinerary(tripId, UUID.fromString(userId)));
    }

    @PostMapping("/days")
    public ResponseEntity<DayResponse> addDay(@PathVariable UUID tripId,
                                              @Valid @RequestBody CreateDayRequest request,
                                              @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itineraryService.addDay(tripId, request, UUID.fromString(userId)));
    }

    @DeleteMapping("/days/{dayId}")
    public ResponseEntity<Void> deleteDay(@PathVariable UUID tripId,
                                          @PathVariable UUID dayId,
                                          @AuthenticationPrincipal String userId) {
        itineraryService.deleteDay(tripId, dayId, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/days/{dayId}/activities")
    public ResponseEntity<ActivityResponse> addActivity(@PathVariable UUID tripId,
                                                        @PathVariable UUID dayId,
                                                        @Valid @RequestBody CreateActivityRequest request,
                                                        @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itineraryService.addActivity(tripId, dayId, request, UUID.fromString(userId)));
    }

    @PatchMapping("/days/{dayId}/activities/{activityId}")
    public ResponseEntity<ActivityResponse> updateActivity(@PathVariable UUID tripId,
                                                           @PathVariable UUID dayId,
                                                           @PathVariable UUID activityId,
                                                           @Valid @RequestBody UpdateActivityRequest request,
                                                           @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(itineraryService.updateActivity(tripId, dayId, activityId, request, UUID.fromString(userId)));
    }

    @DeleteMapping("/days/{dayId}/activities/{activityId}")
    public ResponseEntity<Void> deleteActivity(@PathVariable UUID tripId,
                                               @PathVariable UUID dayId,
                                               @PathVariable UUID activityId,
                                               @AuthenticationPrincipal String userId) {
        itineraryService.deleteActivity(tripId, dayId, activityId, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }
}
