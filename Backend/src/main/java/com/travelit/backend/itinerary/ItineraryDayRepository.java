package com.travelit.backend.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ItineraryDayRepository extends JpaRepository<ItineraryDay, UUID> {
    List<ItineraryDay> findByTrip_IdOrderByDateAsc(UUID tripId);
    Optional<ItineraryDay> findByTrip_IdAndDate(UUID tripId, LocalDate date);
    boolean existsByTrip_IdAndDate(UUID tripId, LocalDate date);
    long countByTrip_Id(UUID tripId);
}
