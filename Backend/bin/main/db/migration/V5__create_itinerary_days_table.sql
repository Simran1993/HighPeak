CREATE TABLE itinerary_days (
    id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID  NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    date       DATE  NOT NULL,
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (trip_id, date)
);

CREATE INDEX idx_itinerary_days_trip_id ON itinerary_days (trip_id);
