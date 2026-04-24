package com.travelit.backend.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class TokenService {

    private static final String PREFIX = "refresh:";

    private final StringRedisTemplate redis;

    public TokenService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void store(String jti, UUID userId, long ttlMs) {
        redis.opsForValue().set(PREFIX + jti, userId.toString(), Duration.ofMillis(ttlMs));
    }

    public boolean isValid(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX + jti));
    }

    public void revoke(String jti) {
        redis.delete(PREFIX + jti);
    }
}
