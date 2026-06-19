# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy gradle wrapper and dependency files first for layer caching
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle

# Download dependencies (cached unless build.gradle changes)
RUN ./gradlew dependencies --no-daemon -q

# Copy source and build
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
