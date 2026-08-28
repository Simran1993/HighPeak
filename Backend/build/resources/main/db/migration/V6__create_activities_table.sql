CREATE TABLE activities (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id       UUID         NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    start_time   TIME,
    location     VARCHAR(255),
    notes        TEXT,
    cost         NUMERIC(10, 2),
    category     VARCHAR(50),
    booking_link VARCHAR(500),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_day_id ON activities (day_id);
