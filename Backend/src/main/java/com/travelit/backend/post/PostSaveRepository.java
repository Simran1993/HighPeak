package com.travelit.backend.post;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostSaveRepository extends JpaRepository<PostSave, PostReactionId> {

    long countByIdPostId(UUID postId);

    boolean existsByIdPostIdAndIdUserId(UUID postId, UUID userId);

    List<PostSave> findByIdUserIdOrderByCreatedAtDesc(UUID userId);
}
