package com.travelit.backend.user;

import com.travelit.backend.user.dto.ProfileResponse;
import com.travelit.backend.user.dto.UpdateProfileRequest;
import com.travelit.backend.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(UserResponse.from(userService.getById(UUID.fromString(userId))));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request,
                                                 @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(UserResponse.from(
                userService.updateProfile(UUID.fromString(userId), request)));
    }

    /** Public profile — no email or auth details. */
    @GetMapping("/{id}")
    public ResponseEntity<ProfileResponse> profile(@PathVariable UUID id) {
        return ResponseEntity.ok(ProfileResponse.from(userService.getById(id)));
    }
}
