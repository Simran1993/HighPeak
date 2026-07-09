package com.travelit.backend.file.dto;

import com.travelit.backend.file.StoredFile;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FileMetadataResponse(
        UUID id,
        String filename,
        String contentType,
        long sizeBytes,
        OffsetDateTime createdAt
) {
    public static FileMetadataResponse from(StoredFile file) {
        return new FileMetadataResponse(
                file.getId(),
                file.getFilename(),
                file.getContentType(),
                file.getSizeBytes(),
                file.getCreatedAt()
        );
    }
}
