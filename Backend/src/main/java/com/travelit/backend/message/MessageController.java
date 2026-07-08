package com.travelit.backend.message;

import com.travelit.backend.message.dto.CreateMessageRequest;
import com.travelit.backend.message.dto.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips/{tripId}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable UUID tripId,
                                                             @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(messageService.getMessages(tripId, UUID.fromString(userId)));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> postMessage(@PathVariable UUID tripId,
                                                       @Valid @RequestBody CreateMessageRequest request,
                                                       @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.postMessage(tripId, request, UUID.fromString(userId)));
    }
}
