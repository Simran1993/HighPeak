package com.travelit.backend.file;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    /** Download a file (decrypted on the fly). Access rules depend on the file's purpose. */
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(@PathVariable UUID id,
                                           @AuthenticationPrincipal String userId) {
        var file = fileStorageService.download(id, UUID.fromString(userId));
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (file.contentType() != null) mediaType = MediaType.parseMediaType(file.contentType());
        } catch (Exception ignored) {
            // fall back to octet-stream
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.filename()).build().toString())
                .body(file.bytes());
    }
}
