package com.travelit.backend.user;

import com.travelit.backend.file.FilePurpose;
import com.travelit.backend.file.FileStorageService;
import com.travelit.backend.file.dto.FileMetadataResponse;
import com.travelit.backend.user.dto.UpdateProfileRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Value("${app.backend-url:http://localhost:8080/api/v1}")
    private String backendUrl;

    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getById(userId);
        if (request.name() != null && !request.name().isBlank()) user.setName(request.name());
        if (request.bio() != null)       user.setBio(request.bio());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.interests() != null)  user.setInterests(UserInterests.join(request.interests()));
        return userRepository.save(user);
    }

    /** Upload a profile picture; stored encrypted, served via the public avatar endpoint. */
    @Transactional
    public User updateAvatar(UUID userId, MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Profile picture must be an image");
        }
        FileMetadataResponse stored = fileStorageService.store(file, FilePurpose.AVATAR, userId);
        User user = getById(userId);
        user.setAvatarUrl(backendUrl + "/files/avatars/" + stored.id());
        return userRepository.save(user);
    }
}
