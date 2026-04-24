package com.travelit.backend.invite;

import com.travelit.backend.invite.dto.InviteRequest;
import com.travelit.backend.invite.dto.InviteResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping("/trips/{tripId}/invites")
    public ResponseEntity<InviteResponse> sendInvite(@PathVariable UUID tripId,
                                                      @Valid @RequestBody InviteRequest request,
                                                      @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inviteService.sendInvite(tripId, request, UUID.fromString(userId)));
    }

    @GetMapping("/trips/{tripId}/invites")
    public ResponseEntity<List<InviteResponse>> getPendingInvites(@PathVariable UUID tripId,
                                                                   @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(inviteService.getPendingInvites(tripId, UUID.fromString(userId)));
    }

    @DeleteMapping("/trips/{tripId}/invites/{inviteId}")
    public ResponseEntity<Void> revokeInvite(@PathVariable UUID tripId,
                                              @PathVariable UUID inviteId,
                                              @AuthenticationPrincipal String userId) {
        inviteService.revokeInvite(tripId, inviteId, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invites/{token}/accept")
    public ResponseEntity<Void> acceptInvite(@PathVariable String token,
                                              @AuthenticationPrincipal String userId) {
        inviteService.acceptInvite(token, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }
}
