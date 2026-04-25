package com.travelit.backend.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByDay_IdOrderByStartTimeAsc(UUID dayId);
}
