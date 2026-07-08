package com.travelit.backend.post;

import com.travelit.backend.itinerary.ActivityRepository;
import com.travelit.backend.itinerary.ItineraryDayRepository;
import com.travelit.backend.itinerary.dto.DayResponse;
import com.travelit.backend.post.dto.CreatePostRequest;
import com.travelit.backend.post.dto.PostResponse;
import com.travelit.backend.post.dto.UpdatePostRequest;
import com.travelit.backend.trip.MemberRole;
import com.travelit.backend.trip.Trip;
import com.travelit.backend.trip.TripMember;
import com.travelit.backend.trip.TripMemberRepository;
import com.travelit.backend.trip.TripStatus;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final PostSaveRepository saveRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ItineraryDayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final UserService userService;

    @Transactional
    public PostResponse create(CreatePostRequest request, UUID userId) {
        TripMember member = tripMemberRepository.findByIdTripIdAndIdUserId(request.tripId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this trip"));
        if (member.getRole() == MemberRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot publish a trip");
        }
        if (postRepository.existsByTrip_Id(request.tripId())) {
            throw new IllegalStateException("This trip has already been posted to Explore");
        }

        Trip trip = member.getTrip();
        trip.setStatus(TripStatus.PUBLISHED);
        User author = userService.getById(userId);

        Post post = postRepository.saveAndFlush(Post.builder()
                .trip(trip)
                .author(author)
                .caption(request.caption())
                .coverImageUrl(request.coverImageUrl())
                .build());

        return toResponse(post, userId);
    }

    @Transactional
    public PostResponse update(UUID postId, UpdatePostRequest request, UUID userId) {
        Post post = findPostOrThrow(postId);
        requireAuthor(post, userId);

        if (request.caption() != null)       post.setCaption(request.caption());
        if (request.coverImageUrl() != null) post.setCoverImageUrl(request.coverImageUrl());

        return toResponse(postRepository.save(post), userId);
    }

    @Transactional
    public void delete(UUID postId, UUID userId) {
        Post post = findPostOrThrow(postId);
        requireAuthor(post, userId);
        post.getTrip().setStatus(TripStatus.DRAFT);
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(int page, int size, UUID userId) {
        return postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(post -> toResponse(post, userId))
                .getContent();
    }

    @Transactional(readOnly = true)
    public PostResponse getById(UUID postId, UUID userId) {
        return toResponse(findPostOrThrow(postId), userId);
    }

    @Transactional(readOnly = true)
    public PostResponse getByTripId(UUID tripId, UUID userId) {
        Post post = postRepository.findByTrip_Id(tripId)
                .orElseThrow(() -> new EntityNotFoundException("This trip has no post"));
        return toResponse(post, userId);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getByAuthor(UUID authorId, UUID requesterId) {
        return postRepository.findByAuthor_IdOrderByCreatedAtDesc(authorId).stream()
                .map(post -> toResponse(post, requesterId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getMine(UUID userId) {
        return postRepository.findByAuthor_IdOrderByCreatedAtDesc(userId).stream()
                .map(post -> toResponse(post, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getSaved(UUID userId) {
        return saveRepository.findByIdUserIdOrderByCreatedAtDesc(userId).stream()
                .map(save -> postRepository.findById(save.getId().getPostId()))
                .flatMap(java.util.Optional::stream)
                .map(post -> toResponse(post, userId))
                .toList();
    }

    /**
     * Public (read-only) view of a posted trip's itinerary — no trip membership required.
     */
    @Transactional(readOnly = true)
    public List<DayResponse> getPostItinerary(UUID postId) {
        Post post = findPostOrThrow(postId);
        UUID tripId = post.getTrip().getId();
        return dayRepository.findByTrip_IdOrderByDateAsc(tripId).stream()
                .map(day -> DayResponse.from(day, activityRepository.findByDay_IdOrderByStartTimeAsc(day.getId())))
                .toList();
    }

    @Transactional
    public void like(UUID postId, UUID userId) {
        findPostOrThrow(postId);
        PostReactionId id = new PostReactionId(postId, userId);
        if (!likeRepository.existsById(id)) {
            likeRepository.save(PostLike.builder().id(id).build());
        }
    }

    @Transactional
    public void unlike(UUID postId, UUID userId) {
        likeRepository.deleteById(new PostReactionId(postId, userId));
    }

    @Transactional
    public void savePost(UUID postId, UUID userId) {
        findPostOrThrow(postId);
        PostReactionId id = new PostReactionId(postId, userId);
        if (!saveRepository.existsById(id)) {
            saveRepository.save(PostSave.builder().id(id).build());
        }
    }

    @Transactional
    public void unsavePost(UUID postId, UUID userId) {
        saveRepository.deleteById(new PostReactionId(postId, userId));
    }

    private PostResponse toResponse(Post post, UUID userId) {
        UUID postId = post.getId();
        UUID tripId = post.getTrip().getId();
        return PostResponse.from(
                post,
                dayRepository.countByTrip_Id(tripId),
                likeRepository.countByIdPostId(postId),
                saveRepository.countByIdPostId(postId),
                likeRepository.existsByIdPostIdAndIdUserId(postId, userId),
                saveRepository.existsByIdPostIdAndIdUserId(postId, userId)
        );
    }

    private Post findPostOrThrow(UUID postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));
    }

    private void requireAuthor(Post post, UUID userId) {
        if (!post.getAuthor().getId().equals(userId)) {
            throw new AccessDeniedException("Only the author can modify this post");
        }
    }
}
