CREATE TABLE posts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID        NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    author_id       UUID        NOT NULL REFERENCES users(id),
    caption         TEXT,
    cover_image_url TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author_id  ON posts (author_id);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

CREATE TABLE post_likes (
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_user_id ON post_likes (user_id);

CREATE TABLE post_saves (
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_saves_user_id ON post_saves (user_id);
