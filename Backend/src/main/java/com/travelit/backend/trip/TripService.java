package com.travelit.backend.trip;

import com.travelit.backend.trip.dto.CreateTripRequest;
import com.travelit.backend.trip.dto.TripMemberResponse;
import com.travelit.backend.trip.dto.TripResponse;
import com.travelit.backend.trip.dto.TripSummaryResponse;
import com.travelit.backend.trip.dto.UpdateTripRequest;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserService;
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
public class TripService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserService userService;
    private final TripEventPublisher eventPublisher;

    @Transactional
    public TripResponse create(CreateTripRequest request, UUID ownerId) {
        User owner = userService.getById(ownerId);

        Trip trip = Trip.builder()
                .title(request.title())
                .description(request.description())
                .destination(request.destination())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(TripStatus.DRAFT)
                .createdBy(owner)
                .build();
        // saveAndFlush so the @CreationTimestamp / @UpdateTimestamp are populated
        // before we build the response (otherwise they'd be null until commit).
        trip = tripRepository.saveAndFlush(trip);

        // Let @MapsId derive the composite key from the trip/user associations, and let
        // the cascade = ALL on Trip.members persist this membership. Pre-setting the
        // @EmbeddedId would make repository.save() take the merge() path, leaving this
        // (detached) instance to collide with its managed copy at flush.
        TripMember ownerMember = TripMember.builder()
                .id(new TripMemberId())
                .trip(trip)
                .user(owner)
                .role(MemberRole.OWNER)
                .build();
        trip.getMembers().add(ownerMember);

        return TripResponse.from(trip, MemberRole.OWNER);
    }

    public List<TripSummaryResponse> getMyTrips(UUID userId) {
        return tripMemberRepository.findByIdUserId(userId).stream()
                .map(TripSummaryResponse::from)
                .toList();
    }

    public TripResponse getById(UUID tripId, UUID userId) {
        Trip trip = findTripOrThrow(tripId);
        TripMember member = findMemberOrThrow(tripId, userId);
        return TripResponse.from(trip, member.getRole());
    }

    @Transactional
    public TripResponse update(UUID tripId, UpdateTripRequest request, UUID userId) {
        Trip trip = findTripOrThrow(tripId);
        TripMember member = findMemberOrThrow(tripId, userId);

        if (member.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot edit trips");
        }

        if (request.title() != null)       trip.setTitle(request.title());
        if (request.description() != null) trip.setDescription(request.description());
        if (request.destination() != null) trip.setDestination(request.destination());
        if (request.startDate() != null)   trip.setStartDate(request.startDate());
        if (request.endDate() != null)     trip.setEndDate(request.endDate());

        TripResponse response = TripResponse.from(tripRepository.save(trip), member.getRole());
        eventPublisher.publish(TripEventType.TRIP_UPDATED, tripId, response, userId);
        return response;
    }

    @Transactional
    public void delete(UUID tripId, UUID userId) {
        findTripOrThrow(tripId);
        TripMember member = findMemberOrThrow(tripId, userId);

        if (member.getRole() != MemberRole.OWNER) {
            throw new AccessDeniedException("Only the owner can delete a trip");
        }

        tripRepository.deleteById(tripId);
    }

    public List<TripMemberResponse> getMembers(UUID tripId, UUID requesterId) {
        findMemberOrThrow(tripId, requesterId);
        return tripMemberRepository.findByIdTripId(tripId).stream()
                .map(TripMemberResponse::from)
                .toList();
    }

    @Transactional
    public void removeMember(UUID tripId, UUID targetUserId, UUID requesterId) {
        TripMember requester = findMemberOrThrow(tripId, requesterId);
        if (requester.getRole() != MemberRole.OWNER) {
            throw new AccessDeniedException("Only the owner can remove members");
        }
        if (targetUserId.equals(requesterId)) {
            throw new IllegalStateException("Owner cannot remove themselves — delete the trip instead");
        }
        TripMember target = findMemberOrThrow(tripId, targetUserId);
        tripMemberRepository.delete(target);
        eventPublisher.publish(TripEventType.MEMBER_REMOVED, tripId, Map.of("userId", targetUserId), requesterId);
    }

    @Transactional
    public void leaveTrip(UUID tripId, UUID userId) {
        TripMember member = findMemberOrThrow(tripId, userId);
        if (member.getRole() == MemberRole.OWNER) {
            throw new IllegalStateException("Owner cannot leave — delete the trip instead");
        }
        tripMemberRepository.delete(member);
        eventPublisher.publish(TripEventType.MEMBER_LEFT, tripId, Map.of("userId", userId), userId);
    }

    private Trip findTripOrThrow(UUID tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
    }

    private TripMember findMemberOrThrow(UUID tripId, UUID userId) {
        return tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
    }
}
