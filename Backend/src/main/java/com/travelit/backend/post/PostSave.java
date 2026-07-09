package com.travelit.backend.post;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "post_saves")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSave {

    @EmbeddedId
    private PostReactionId id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
