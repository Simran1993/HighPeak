package com.travelit.backend.ai;

import com.travelit.backend.ai.dto.GenerateItineraryRequest;
import com.travelit.backend.itinerary.dto.DayResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips/{tripId}/ai")
@RequiredArgsConstructor
public class AiItineraryController {

    private final AiItineraryService aiItineraryService;

    /**
     * Generates a day-by-day itinerary from a free-form prompt plus the trip's own
     * dates/destination, and persists it directly into the trip's itinerary days/activities.
     */
    @PostMapping("/itinerary")
    public ResponseEntity<List<DayResponse>> generateItinerary(@PathVariable UUID tripId,
                                                                @Valid @RequestBody GenerateItineraryRequest request,
                                                                @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aiItineraryService.generateItinerary(tripId, request, UUID.fromString(userId)));
    }
}
