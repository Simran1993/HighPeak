package com.travelit.backend.ai;

import com.travelit.backend.ai.dto.GenerateItineraryRequest;
import com.travelit.backend.ai.dto.GeneratedItinerary;
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
     * Step 1 — propose an itinerary from the prompt + the trip's dates/destination,
     * WITHOUT saving. The client previews this and calls {@code /apply} to confirm.
     */
    @PostMapping("/itinerary/suggest")
    public ResponseEntity<GeneratedItinerary> suggest(@PathVariable UUID tripId,
                                                      @Valid @RequestBody GenerateItineraryRequest request,
                                                      @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(aiItineraryService.suggest(tripId, request, UUID.fromString(userId)));
    }

    /**
     * Step 2 — commit a proposal the user has reviewed and confirmed into the trip.
     */
    @PostMapping("/itinerary/apply")
    public ResponseEntity<List<DayResponse>> apply(@PathVariable UUID tripId,
                                                   @RequestBody GeneratedItinerary proposal,
                                                   @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aiItineraryService.apply(tripId, proposal, UUID.fromString(userId)));
    }

    /**
     * One-shot generate + persist (legacy; the suggest/apply pair is preferred).
     */
    @PostMapping("/itinerary")
    public ResponseEntity<List<DayResponse>> generateItinerary(@PathVariable UUID tripId,
                                                                @Valid @RequestBody GenerateItineraryRequest request,
                                                                @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aiItineraryService.generateItinerary(tripId, request, UUID.fromString(userId)));
    }
}
