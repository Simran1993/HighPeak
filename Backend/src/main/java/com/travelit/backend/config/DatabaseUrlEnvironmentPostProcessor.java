package com.travelit.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Translates a Railway-style {@code DATABASE_URL}
 * ({@code postgresql://user:pass@host:port/db}) into the {@code spring.datasource.*}
 * properties Spring Boot expects.
 *
 * <p>Only applies when {@code DATABASE_URL} is present and the explicit
 * {@code DB_HOST} variable is NOT set, so local development and the
 * {@code DB_HOST}/{@code DB_PORT}/... mapping continue to work unchanged.
 * If parsing fails, the app falls back to the datasource configured in
 * {@code application.yml}.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank() || !databaseUrl.startsWith("postgres")) {
            return;
        }
        // Explicit DB_HOST wins — don't override a deliberate configuration.
        if (environment.getProperty("DB_HOST") != null) {
            return;
        }

        try {
            URI uri = new URI(databaseUrl);
            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String path = uri.getPath();
            String db = (path != null && path.length() > 1) ? path.substring(1) : "";

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(host).append(':').append(port).append('/').append(db);
            if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                jdbcUrl.append('?').append(uri.getQuery());
            }

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", jdbcUrl.toString());

            String userInfo = uri.getUserInfo();
            if (userInfo != null) {
                String[] parts = userInfo.split(":", 2);
                props.put("spring.datasource.username", parts[0]);
                if (parts.length > 1) {
                    props.put("spring.datasource.password", parts[1]);
                }
            }

            environment.getPropertySources()
                    .addFirst(new MapPropertySource("railwayDatabaseUrl", props));
        } catch (Exception ex) {
            // Leave the yml-configured datasource in place if the URL is unparseable.
            System.err.println("DatabaseUrlEnvironmentPostProcessor: failed to parse DATABASE_URL: " + ex.getMessage());
        }
    }
}
