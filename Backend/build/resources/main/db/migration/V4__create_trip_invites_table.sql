CREATE TABLE trip_invites (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id       UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    invited_by    UUID         NOT NULL REFERENCES users(id),
    invited_email VARCHAR(255) NOT NULL,
    token         VARCHAR(255) NOT NULL UNIQUE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_invites_token   ON trip_invites (token);
CREATE INDEX idx_trip_invites_email   ON trip_invites (invited_email);
CREATE INDEX idx_trip_invites_trip_id ON trip_invites (trip_id);
