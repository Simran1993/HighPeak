package com.travelit.backend.auth.service;

import com.travelit.backend.auth.dto.AuthResponse;
import com.travelit.backend.auth.dto.LoginRequest;
import com.travelit.backend.auth.dto.RegisterRequest;
import com.travelit.backend.exception.EmailAlreadyExistsException;
import com.travelit.backend.exception.InvalidTokenException;
import com.travelit.backend.invite.InviteService;
import com.travelit.backend.security.JwtService;
import com.travelit.backend.security.TokenService;
import com.travelit.backend.user.AuthProvider;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final InviteService inviteService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("Email already registered");
        }
        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name())
                .authProvider(AuthProvider.LOCAL)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);
        inviteService.autoAcceptPendingInvites(user);
        return issueTokensForUser(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return issueTokensForUser(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }
        String jti = jwtService.extractJti(refreshToken);
        if (!tokenService.isValid(jti)) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }
        // rotate: revoke old, issue new
        tokenService.revoke(jti);
        UUID userId = UUID.fromString(jwtService.extractUserId(refreshToken));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));
        return issueTokensForUser(user);
    }

    public void logout(String refreshToken) {
        if (jwtService.isTokenValid(refreshToken)) {
            tokenService.revoke(jwtService.extractJti(refreshToken));
        }
    }

    public AuthResponse issueTokensForUser(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        tokenService.store(jwtService.extractJti(refreshToken), user.getId(), jwtService.getRefreshExpirationMs());
        return new AuthResponse(accessToken, refreshToken, user.getId(), user.getEmail(), user.getName());
    }
}
