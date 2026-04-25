package com.travelit.backend.trip;

import com.travelit.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "trip_members")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripMember {

    @EmbeddedId
    private TripMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tripId")
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberRole role;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime joinedAt;
}
