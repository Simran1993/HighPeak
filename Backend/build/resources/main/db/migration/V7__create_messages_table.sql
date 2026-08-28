CREATE TABLE messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_trip_id_created_at ON messages (trip_id, created_at);
