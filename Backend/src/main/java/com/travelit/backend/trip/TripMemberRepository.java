package com.travelit.backend.trip;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripMemberRepository extends JpaRepository<TripMember, TripMemberId> {
    List<TripMember> findByIdUserId(UUID userId);
    Optional<TripMember> findByIdTripIdAndIdUserId(UUID tripId, UUID userId);
}
