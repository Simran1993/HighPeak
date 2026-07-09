package com.travelit.backend.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    /** Metadata-only projection — avoids loading ciphertext for listings. */
    @Query("""
            select new com.travelit.backend.file.dto.FileMetadataResponse(
                f.id, f.filename, f.contentType, f.sizeBytes, f.createdAt)
            from StoredFile f
            where f.owner.id = :ownerId and f.purpose = :purpose
            order by f.createdAt desc
            """)
    List<com.travelit.backend.file.dto.FileMetadataResponse> findMetadataByOwnerAndPurpose(
            UUID ownerId, FilePurpose purpose);
}
