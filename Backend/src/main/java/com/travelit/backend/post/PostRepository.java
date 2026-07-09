package com.travelit.backend.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findByAuthor_IdOrderByCreatedAtDesc(UUID authorId);

    Optional<Post> findByTrip_Id(UUID tripId);

    boolean existsByTrip_Id(UUID tripId);
}
