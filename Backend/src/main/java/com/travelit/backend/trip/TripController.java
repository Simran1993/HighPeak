package com.travelit.backend.trip;

import com.travelit.backend.trip.dto.CreateTripRequest;
import com.travelit.backend.trip.dto.TripMemberResponse;
import com.travelit.backend.trip.dto.TripResponse;
import com.travelit.backend.trip.dto.TripSummaryResponse;
import com.travelit.backend.trip.dto.UpdateTripRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public ResponseEntity<TripResponse> create(@Valid @RequestBody CreateTripRequest request,
                                               @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripService.create(request, UUID.fromString(userId)));
    }

    @GetMapping
    public ResponseEntity<List<TripSummaryResponse>> getMyTrips(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(tripService.getMyTrips(UUID.fromString(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getById(@PathVariable UUID id,
                                                @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(tripService.getById(id, UUID.fromString(userId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TripResponse> update(@PathVariable UUID id,
                                               @Valid @RequestBody UpdateTripRequest request,
                                               @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(tripService.update(id, request, UUID.fromString(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal String userId) {
        tripService.delete(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<TripMemberResponse>> getMembers(@PathVariable UUID id,
                                                               @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(tripService.getMembers(id, UUID.fromString(userId)));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID id,
                                             @PathVariable UUID memberId,
                                             @AuthenticationPrincipal String userId) {
        tripService.removeMember(id, memberId, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/me")
    public ResponseEntity<Void> leaveTrip(@PathVariable UUID id,
                                          @AuthenticationPrincipal String userId) {
        tripService.leaveTrip(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }
}
