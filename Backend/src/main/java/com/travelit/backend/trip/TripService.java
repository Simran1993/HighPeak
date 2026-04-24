package com.travelit.backend.trip;

import com.travelit.backend.trip.dto.CreateTripRequest;
import com.travelit.backend.trip.dto.TripResponse;
import com.travelit.backend.trip.dto.TripSummaryResponse;
import com.travelit.backend.trip.dto.UpdateTripRequest;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public TripResponse create(CreateTripRequest request, UUID ownerId) {
        User owner = userRepository.getReferenceById(ownerId);

        Trip trip = Trip.builder()
                .title(request.title())
                .description(request.description())
                .destination(request.destination())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(TripStatus.DRAFT)
                .createdBy(owner)
                .build();
        trip = tripRepository.save(trip);

        TripMember ownerMember = TripMember.builder()
                .id(new TripMemberId(trip.getId(), ownerId))
                .trip(trip)
                .user(owner)
                .role(MemberRole.OWNER)
                .build();
        tripMemberRepository.save(ownerMember);
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

        return TripResponse.from(tripRepository.save(trip), member.getRole());
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

    private Trip findTripOrThrow(UUID tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
    }

    private TripMember findMemberOrThrow(UUID tripId, UUID userId) {
        return tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
    }
}
