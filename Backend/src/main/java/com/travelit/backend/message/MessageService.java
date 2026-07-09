package com.travelit.backend.message;

import com.travelit.backend.file.FilePurpose;
import com.travelit.backend.file.FileStorageService;
import com.travelit.backend.file.dto.FileMetadataResponse;
import com.travelit.backend.file.StoredFile;
import com.travelit.backend.message.dto.CreateMessageRequest;
import com.travelit.backend.message.dto.MessageResponse;
import com.travelit.backend.trip.Trip;
import com.travelit.backend.trip.TripMemberRepository;
import com.travelit.backend.trip.TripRepository;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserService;
import com.travelit.backend.websocket.TripEventPublisher;
import com.travelit.backend.websocket.TripEventType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final TripEventPublisher eventPublisher;

    public List<MessageResponse> getMessages(UUID tripId, UUID userId) {
        validateMember(tripId, userId);
        return messageRepository.findByTrip_IdOrderByCreatedAtAsc(tripId).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse postMessage(UUID tripId, CreateMessageRequest request, UUID userId) {
        validateMember(tripId, userId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        User author = userService.getById(userId);

        boolean hasText = request.content() != null && !request.content().isBlank();
        if (!hasText && request.attachmentId() == null) {
            throw new IllegalArgumentException("Message needs text or an attachment");
        }
        StoredFile attachment = request.attachmentId() != null
                ? fileStorageService.getOwnedAttachment(request.attachmentId(), userId)
                : null;

        Message message = Message.builder()
                .trip(trip)
                .author(author)
                .content(hasText ? request.content() : "")
                .attachment(attachment)
                .build();
        // saveAndFlush so @CreationTimestamp is populated before we build the response.
        MessageResponse response = MessageResponse.from(messageRepository.saveAndFlush(message));
        eventPublisher.publish(TripEventType.MESSAGE_ADDED, tripId, response, userId);
        return response;
    }

    @Transactional
    public FileMetadataResponse uploadAttachment(UUID tripId, MultipartFile file, UUID userId) {
        validateMember(tripId, userId);
        return fileStorageService.store(file, FilePurpose.MESSAGE_ATTACHMENT, userId);
    }

    private void validateMember(UUID tripId, UUID userId) {
        tripMemberRepository.findByIdTripIdAndIdUserId(tripId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
    }
}
