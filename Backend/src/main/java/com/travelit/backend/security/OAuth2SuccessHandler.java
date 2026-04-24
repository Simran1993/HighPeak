package com.travelit.backend.security;

import com.travelit.backend.auth.dto.AuthResponse;
import com.travelit.backend.auth.service.AuthService;
import com.travelit.backend.user.AuthProvider;
import com.travelit.backend.user.User;
import com.travelit.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        Map<String, Object> attrs = token.getPrincipal().getAttributes();

        String providerId = (String) attrs.get("sub");
        String email     = (String) attrs.get("email");
        String name      = (String) attrs.get("name");
        String avatarUrl = (String) attrs.get("picture");

        User user = resolveUser(providerId, email, name, avatarUrl);
        AuthResponse authResponse = authService.issueTokensForUser(user);

        response.sendRedirect(frontendUrl + "/auth/callback"
                + "?accessToken=" + authResponse.accessToken()
                + "&refreshToken=" + authResponse.refreshToken());
    }

    private User resolveUser(String providerId, String email, String name, String avatarUrl) {
        // 1. Known Google user
        return userRepository.findByAuthProviderAndProviderId(AuthProvider.GOOGLE, providerId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        // 2. Existing local account — link Google to it
                        .map(existing -> {
                            existing.setProviderId(providerId);
                            existing.setAvatarUrl(avatarUrl);
                            existing.setEmailVerified(true);
                            return userRepository.save(existing);
                        })
                        // 3. Brand-new Google user
                        .orElseGet(() -> userRepository.save(User.builder()
                                .email(email)
                                .name(name)
                                .providerId(providerId)
                                .avatarUrl(avatarUrl)
                                .authProvider(AuthProvider.GOOGLE)
                                .emailVerified(true)
                                .build())));
    }
}
