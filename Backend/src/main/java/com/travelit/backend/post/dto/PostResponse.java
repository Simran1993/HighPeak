package com.travelit.backend.post.dto;

import com.travelit.backend.post.Post;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PostResponse(
        UUID id,
        UUID tripId,
        String caption,
        String coverImageUrl,
        UUID authorId,
        String authorName,
        String authorAvatarUrl,
        String tripTitle,
        String tripDescription,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        long dayCount,
        long likeCount,
        long saveCount,
        boolean likedByMe,
        boolean savedByMe,
        OffsetDateTime createdAt
) {
    public static PostResponse from(Post post, long dayCount,
                                    long likeCount, long saveCount,
                                    boolean likedByMe, boolean savedByMe) {
        var trip = post.getTrip();
        var author = post.getAuthor();
        return new PostResponse(
                post.getId(),
                trip.getId(),
                post.getCaption(),
                post.getCoverImageUrl(),
                author.getId(),
                author.getName(),
                author.getAvatarUrl(),
                trip.getTitle(),
                trip.getDescription(),
                trip.getDestination(),
                trip.getStartDate(),
                trip.getEndDate(),
                dayCount,
                likeCount,
                saveCount,
                likedByMe,
                savedByMe,
                post.getCreatedAt()
        );
    }
}
