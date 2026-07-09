package com.travelit.backend.vault;

import com.travelit.backend.file.FilePurpose;
import com.travelit.backend.file.FileStorageService;
import com.travelit.backend.file.dto.FileMetadataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Personal document vault — passports, tickets, booking confirmations.
 * Files are AES-256-GCM encrypted at rest and accessible ONLY to their owner
 * (enforced in FileStorageService, not just hidden in the UI).
 */
@RestController
@RequestMapping("/vault")
@RequiredArgsConstructor
public class VaultController {

    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<FileMetadataResponse> upload(@RequestParam("file") MultipartFile file,
                                                       @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fileStorageService.store(file, FilePurpose.VAULT_DOCUMENT, UUID.fromString(userId)));
    }

    @GetMapping
    public ResponseEntity<List<FileMetadataResponse>> list(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(fileStorageService.listVault(UUID.fromString(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal String userId) {
        fileStorageService.deleteVaultDocument(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }
}
