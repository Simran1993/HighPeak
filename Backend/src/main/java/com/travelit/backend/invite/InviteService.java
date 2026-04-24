package com.travelit.backend.invite;

import com.travelit.backend.invite.dto.InviteRequest;
import com.travelit.backend.invite.dto.InviteResponse;
import com.travelit.backend.trip.*;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final TripInviteRepository inviteRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserService userService;
    private final InviteMailService mailService;

    @Value("${app.invite.expiration-hours}")
    private int expirationHours;

    @Transactional
    public InviteResponse sendInvite(UUID tripId, InviteRequest request, UUID invitedById) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));

        TripMember inviter = tripMemberRepository.findByIdTripIdAndIdUserId(tripId, invitedById)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
        if (inviter.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot invite members");
        }

        String normalizedEmail = request.email().toLowerCase();

        if (inviteRepository.existsByTrip_IdAndInvitedEmailIgnoreCaseAndStatus(tripId, normalizedEmail, InviteStatus.PENDING)) {
            throw new IllegalStateException("A pending invite already exists for this email");
        }

        User invitedBy = userService.getById(invitedById);
        TripInvite invite = TripInvite.builder()
                .trip(trip)
                .invitedBy(invitedBy)
                .invitedEmail(normalizedEmail)
                .token(UUID.randomUUID().toString())
                .status(InviteStatus.PENDING)
                .expiresAt(OffsetDateTime.now().plusHours(expirationHours))
                .build();
        invite = inviteRepository.save(invite);

        mailService.sendInviteEmail(normalizedEmail, trip.getTitle(), invitedBy.getName(), invite.getToken());

        return InviteResponse.from(invite);
    }

    @Transactional
    public void acceptInvite(String token, UUID userId) {
        TripInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new EntityNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new IllegalStateException("Invite is no longer valid");
        }
        if (invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
            invite.setStatus(InviteStatus.EXPIRED);
            inviteRepository.save(invite);
            throw new IllegalStateException("Invite has expired");
        }

        User user = userService.getById(userId);
        if (!user.getEmail().equalsIgnoreCase(invite.getInvitedEmail())) {
            throw new AccessDeniedException("This invite was sent to a different email address");
        }

        UUID tripId = invite.getTrip().getId();
        if (tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId).isEmpty()) {
            TripMember member = TripMember.builder()
                    .id(new TripMemberId(tripId, userId))
                    .trip(invite.getTrip())
                    .user(user)
                    .role(MemberRole.EDITOR)
                    .build();
            tripMemberRepository.save(member);
        }

        invite.setStatus(InviteStatus.ACCEPTED);
        inviteRepository.save(invite);
    }

    // Called after registration to auto-accept any pending invites for the new user's email
    @Transactional
    public void autoAcceptPendingInvites(User user) {
        List<TripInvite> pending = inviteRepository
                .findByInvitedEmailIgnoreCaseAndStatus(user.getEmail(), InviteStatus.PENDING);

        for (TripInvite invite : pending) {
            if (invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
                invite.setStatus(InviteStatus.EXPIRED);
                continue;
            }
            UUID tripId = invite.getTrip().getId();
            if (tripMemberRepository.findByIdTripIdAndIdUserId(tripId, user.getId()).isEmpty()) {
                TripMember member = TripMember.builder()
                        .id(new TripMemberId(tripId, user.getId()))
                        .trip(invite.getTrip())
                        .user(user)
                        .role(MemberRole.EDITOR)
                        .build();
                tripMemberRepository.save(member);
            }
            invite.setStatus(InviteStatus.ACCEPTED);
        }
        inviteRepository.saveAll(pending);
    }

    public List<InviteResponse> getPendingInvites(UUID tripId, UUID requesterId) {
        TripMember member = tripMemberRepository.findByIdTripIdAndIdUserId(tripId, requesterId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
        if (member.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot view invites");
        }
        return inviteRepository.findByTrip_IdAndStatus(tripId, InviteStatus.PENDING).stream()
                .map(InviteResponse::from)
                .toList();
    }

    @Transactional
    public void revokeInvite(UUID tripId, UUID inviteId, UUID requesterId) {
        TripMember member = tripMemberRepository.findByIdTripIdAndIdUserId(tripId, requesterId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
        if (member.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot revoke invites");
        }

        TripInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new EntityNotFoundException("Invite not found"));
        if (!invite.getTrip().getId().equals(tripId)) {
            throw new EntityNotFoundException("Invite not found");
        }
        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new IllegalStateException("Only pending invites can be revoked");
        }

        invite.setStatus(InviteStatus.REVOKED);
        inviteRepository.save(invite);
    }
}
