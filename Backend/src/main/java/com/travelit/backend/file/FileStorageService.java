package com.travelit.backend.file;

import com.travelit.backend.file.dto.FileMetadataResponse;
import com.travelit.backend.message.MessageRepository;
import com.travelit.backend.trip.TripMemberRepository;
import com.travelit.backend.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    private final StoredFileRepository fileRepository;
    private final FileCryptoService crypto;
    private final UserService userService;
    private final MessageRepository messageRepository;
    private final TripMemberRepository tripMemberRepository;

    @Transactional
    public FileMetadataResponse store(MultipartFile upload, FilePurpose purpose, UUID ownerId) {
        if (upload.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (upload.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds the 10 MB limit");
        }
        byte[] iv = crypto.newIv();
        byte[] ciphertext;
        try {
            ciphertext = crypto.encrypt(upload.getBytes(), iv);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        StoredFile file = StoredFile.builder()
                .owner(userService.getById(ownerId))
                .filename(sanitize(upload.getOriginalFilename()))
                .contentType(upload.getContentType())
                .sizeBytes(upload.getSize())
                .purpose(purpose)
                .iv(iv)
                .data(ciphertext)
                .build();
        return FileMetadataResponse.from(fileRepository.saveAndFlush(file));
    }

    /** Decrypted file content, after enforcing access rules. */
    @Transactional(readOnly = true)
    public DecryptedFile download(UUID fileId, UUID requesterId) {
        StoredFile file = findOrThrow(fileId);
        enforceAccess(file, requesterId);
        return new DecryptedFile(
                file.getFilename(),
                file.getContentType(),
                crypto.decrypt(file.getData(), file.getIv()));
    }

    @Transactional(readOnly = true)
    public List<FileMetadataResponse> listVault(UUID ownerId) {
        return fileRepository.findMetadataByOwnerAndPurpose(ownerId, FilePurpose.VAULT_DOCUMENT);
    }

    @Transactional
    public void deleteVaultDocument(UUID fileId, UUID requesterId) {
        StoredFile file = findOrThrow(fileId);
        if (file.getPurpose() != FilePurpose.VAULT_DOCUMENT
                || !file.getOwner().getId().equals(requesterId)) {
            throw new AccessDeniedException("This document is not in your vault");
        }
        fileRepository.delete(file);
    }

    /** Owner check used when a message references an attachment. */
    @Transactional(readOnly = true)
    public StoredFile getOwnedAttachment(UUID fileId, UUID ownerId) {
        StoredFile file = findOrThrow(fileId);
        if (file.getPurpose() != FilePurpose.MESSAGE_ATTACHMENT
                || !file.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Not your attachment");
        }
        return file;
    }

    private void enforceAccess(StoredFile file, UUID requesterId) {
        boolean isOwner = file.getOwner().getId().equals(requesterId);
        switch (file.getPurpose()) {
            case VAULT_DOCUMENT -> {
                // Vault documents are strictly private to their owner.
                if (!isOwner) throw new AccessDeniedException("This document is private");
            }
            case MESSAGE_ATTACHMENT -> {
                if (isOwner) return;
                // Shared in a trip chat → any member of that trip may download.
                boolean sharedWithRequester = messageRepository.findByAttachment_Id(file.getId())
                        .map(m -> tripMemberRepository
                                .findByIdTripIdAndIdUserId(m.getTrip().getId(), requesterId)
                                .isPresent())
                        .orElse(false);
                if (!sharedWithRequester) throw new AccessDeniedException("No access to this file");
            }
        }
    }

    private StoredFile findOrThrow(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new EntityNotFoundException("File not found"));
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        String cleaned = name.replaceAll("[\\r\\n\"\\\\/]", "_");
        return cleaned.length() > 255 ? cleaned.substring(cleaned.length() - 255) : cleaned;
    }

    public record DecryptedFile(String filename, String contentType, byte[] bytes) {}
}
