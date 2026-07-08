package com.travelit.backend.post;

import com.travelit.backend.itinerary.dto.DayResponse;
import com.travelit.backend.post.dto.CreatePostRequest;
import com.travelit.backend.post.dto.PostResponse;
import com.travelit.backend.post.dto.UpdatePostRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody CreatePostRequest request,
                                               @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.create(request, UUID.fromString(userId)));
    }

    /** Explore feed — newest first, paginated. */
    @GetMapping
    public ResponseEntity<List<PostResponse>> getFeed(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size,
                                                      @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(postService.getFeed(page, Math.min(size, 50), UUID.fromString(userId)));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<PostResponse>> getMine(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(postService.getMine(UUID.fromString(userId)));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<PostResponse>> getSaved(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(postService.getSaved(UUID.fromString(userId)));
    }

    @GetMapping("/by-trip/{tripId}")
    public ResponseEntity<PostResponse> getByTrip(@PathVariable UUID tripId,
                                                  @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(postService.getByTripId(tripId, UUID.fromString(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getById(@PathVariable UUID id,
                                                @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(postService.getById(id, UUID.fromString(userId)));
    }

    /** Read-only itinerary of a posted trip — no membership required. */
    @GetMapping("/{id}/itinerary")
    public ResponseEntity<List<DayResponse>> getItinerary(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.getPostItinerary(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostResponse> update(@PathVariable UUID id,
                                               @Valid @RequestBody UpdatePostRequest request,
                                               @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(postService.update(id, request, UUID.fromString(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal String userId) {
        postService.delete(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> like(@PathVariable UUID id, @AuthenticationPrincipal String userId) {
        postService.like(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlike(@PathVariable UUID id, @AuthenticationPrincipal String userId) {
        postService.unlike(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Void> save(@PathVariable UUID id, @AuthenticationPrincipal String userId) {
        postService.savePost(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsave(@PathVariable UUID id, @AuthenticationPrincipal String userId) {
        postService.unsavePost(id, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }
}
