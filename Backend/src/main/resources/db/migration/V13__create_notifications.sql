CREATE TABLE notifications (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    type         VARCHAR(30)  NOT NULL,
    message      TEXT         NOT NULL,
    link         VARCHAR(512),
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread  ON notifications (recipient_id) WHERE is_read = FALSE;
