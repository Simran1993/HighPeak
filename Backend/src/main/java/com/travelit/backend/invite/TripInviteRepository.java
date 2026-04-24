package com.travelit.backend.invite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripInviteRepository extends JpaRepository<TripInvite, UUID> {
    Optional<TripInvite> findByToken(String token);
    List<TripInvite> findByTrip_IdAndStatus(UUID tripId, InviteStatus status);
    List<TripInvite> findByInvitedEmailIgnoreCaseAndStatus(String email, InviteStatus status);
    boolean existsByTrip_IdAndInvitedEmailIgnoreCaseAndStatus(UUID tripId, String email, InviteStatus status);
}
