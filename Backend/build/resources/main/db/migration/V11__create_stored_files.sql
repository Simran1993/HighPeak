-- Encrypted file storage: chat attachments + personal document vault.
-- File bytes are AES-256-GCM encrypted at rest; iv is the per-file nonce.
CREATE TABLE stored_files (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename     VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size_bytes   BIGINT       NOT NULL,
    purpose      VARCHAR(30)  NOT NULL,
    iv           BYTEA        NOT NULL,
    data         BYTEA        NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stored_files_owner_purpose ON stored_files (owner_id, purpose);

ALTER TABLE messages ADD COLUMN attachment_id UUID REFERENCES stored_files(id) ON DELETE SET NULL;
