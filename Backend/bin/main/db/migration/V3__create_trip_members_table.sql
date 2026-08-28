CREATE TABLE trip_members (
    trip_id   UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX idx_trip_members_user_id ON trip_members (user_id);
