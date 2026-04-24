package com.travelit.backend.trip;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TripMemberId implements Serializable {
    private UUID tripId;
    private UUID userId;
}
