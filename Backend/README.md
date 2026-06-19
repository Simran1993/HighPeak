# HighPeak — Backend

The Spring Boot backend for **HighPeak**, a collaborative trip-planning application.
It exposes a REST API for authentication, trip management, itinerary building, member
invitations, and real-time collaboration over WebSocket (STOMP).

Base package: `com.travelit.backend` · API served at `http://localhost:8080/api/v1`.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Language / Runtime | Java 21 |
| Framework | Spring Boot 3.5 |
| Datastore | PostgreSQL 16 (schema managed by **Flyway**) |
| Cache / Sessions | Redis 7 (refresh-token storage) |
| Security | Spring Security, JWT (`jjwt 0.12.5`), Google OAuth2 |
| Real-time | WebSocket + STOMP |
| Mail (dev) | MailHog (catch-all SMTP for invite emails) |
| API Docs | SpringDoc / Swagger UI |
| Testing | JUnit 5, Testcontainers (PostgreSQL) |
| Boilerplate | Lombok |

---

## Getting Started

All commands run from the `Backend/` directory unless noted otherwise.

### 1. Start infrastructure

Postgres, Redis, and MailHog are provided via Docker Compose (run from the **repo root**):

```bash
docker compose up -d
```

| Service | URL / Port |
|---|---|
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| MailHog (SMTP) | `localhost:1025` |
| MailHog (Web UI) | http://localhost:8025 |

### 2. Build

```bash
./gradlew build
```

### 3. Run

```bash
./gradlew bootRun
```

The app starts on **http://localhost:8080/api/v1**.
Sensible localhost defaults mean it runs out of the box once `docker compose up -d` is up — no extra configuration needed for development.

### 4. API documentation

- Swagger UI: http://localhost:8080/api/v1/swagger-ui.html
- OpenAPI spec: http://localhost:8080/api/v1/api-docs

---

## Configuration

All configuration in `src/main/resources/application.yml` reads from environment
variables with localhost defaults. See `.env.example` at the repo root for a
production-oriented template.

| Env var | Default | Purpose |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | `localhost` / `5432` / `tp-backend` / `tp-backend` / `tp-backend` | PostgreSQL |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Redis |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` | `localhost` / `1025` / _(empty)_ / _(empty)_ | SMTP |
| `JWT_SECRET` | dev placeholder | JWT signing key — **must be ≥ 64 chars in production** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | _(empty)_ | Google OAuth2 (optional) |
| `FRONTEND_URL` | `http://localhost:5173` | CORS / OAuth2 redirect target |

Other notable settings:

- Access-token lifetime: `app.jwt.expiration-ms` (24 h)
- Refresh-token lifetime: `app.jwt.refresh-expiration-ms` (7 days)
- Invite link lifetime: `app.invite.expiration-hours` (168 h = 7 days)

---

## Architecture

### Authentication

Dual auth flow, both producing a JWT the frontend stores and sends as
`Authorization: Bearer <token>`:

- **Stateless JWT** for REST endpoints.
- **Google OAuth2** client login.

Refresh tokens are tracked in Redis within the refresh-expiration window.

### Database & Migrations

- `ddl-auto: validate` — Hibernate **never** creates or alters tables.
- All schema changes are **Flyway-only**. Add migrations to
  `src/main/resources/db/migration/` using the naming convention
  `V{n}__{description}.sql`.

Current migrations:

```
V1__create_users_table.sql
V2__create_trips_table.sql
V3__create_trip_members_table.sql
V4__create_trip_invites_table.sql
V5__create_itinerary_days_table.sql
V6__create_activities_table.sql
```

### Module layout

```
com.travelit.backend
├── auth        — register / login / refresh / logout (JWT)
├── user        — user profile
├── trip        — trips, members, roles
├── itinerary   — itinerary days & activities
├── invite      — time-limited invite links + email
├── security    — JWT, OAuth2, Spring Security config, token service
├── websocket   — STOMP config + real-time trip events
└── exception   — centralized @ControllerAdvice error handling
```

### Real-time collaboration

STOMP over WebSocket for live trip updates.

- Endpoint: `/ws`
- App destination prefix: `/app`
- Broker: `/topic` — clients subscribe to `/topic/trips/{tripId}` for trip events.

---

## REST API Overview

All paths are relative to the context path `/api/v1`.

### Auth — `/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/refresh` | Exchange a refresh token for a new access token |
| POST | `/auth/logout` | Invalidate the refresh token |

### Users — `/users`
| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Current authenticated user |

### Trips — `/trips`
| Method | Path | Description |
|---|---|---|
| POST | `/trips` | Create a trip |
| GET | `/trips` | List the current user's trips |
| GET | `/trips/{id}` | Get a trip |
| PATCH | `/trips/{id}` | Update a trip |
| DELETE | `/trips/{id}` | Delete a trip |
| GET | `/trips/{id}/members` | List trip members |
| DELETE | `/trips/{id}/members/{memberId}` | Remove a member |
| DELETE | `/trips/{id}/members/me` | Leave a trip |

### Itinerary — `/trips/{tripId}/itinerary`
| Method | Path | Description |
|---|---|---|
| GET | `/trips/{tripId}/itinerary` | Get the full itinerary |
| POST | `/trips/{tripId}/itinerary/days` | Add a day |
| DELETE | `/trips/{tripId}/itinerary/days/{dayId}` | Remove a day |
| POST | `/trips/{tripId}/itinerary/days/{dayId}/activities` | Add an activity |
| PATCH | `/trips/{tripId}/itinerary/days/{dayId}/activities/{activityId}` | Update an activity |
| DELETE | `/trips/{tripId}/itinerary/days/{dayId}/activities/{activityId}` | Remove an activity |

### Invites
| Method | Path | Description |
|---|---|---|
| POST | `/trips/{tripId}/invites` | Create an invite (sends email) |
| GET | `/trips/{tripId}/invites` | List a trip's invites |
| DELETE | `/trips/{tripId}/invites/{inviteId}` | Revoke an invite |
| POST | `/invites/{token}/accept` | Accept an invite link |

> For request/response schemas and examples, see Swagger UI or [`API_DOCS.md`](../API_DOCS.md) at the repo root.

---

## Testing

```bash
# Run all tests
./gradlew test

# Run a single test class
./gradlew test --tests "com.travelit.backend.SomeTest"

# Run a single test method
./gradlew test --tests "com.travelit.backend.SomeTest.methodName"
```

Integration tests use **Testcontainers** (PostgreSQL) rather than an external database.

---

## Production Build (Docker)

A multi-stage `Dockerfile` builds the JAR and runs it on a JRE base image as a non-root user:

```bash
docker build -t highpeak-backend Backend/
```

A production compose file (`docker-compose.prod.yml`) and `application-prod.yml` are
provided at the repo root. Supply real secrets via the environment variables listed in
[Configuration](#configuration) (see `.env.example`).

---

## Contributing Conventions

- Keep controllers thin — business logic lives in services, DB access in repositories.
- Never expose JPA entities in API responses; map to DTOs.
- Validate request DTOs with Jakarta Bean Validation (`@NotNull`, `@Email`, `@Size`, …).
- Use constructor injection (no field injection).
- Annotate write operations with `@Transactional` at the service layer.
- Centralize error handling in `@ControllerAdvice`.
- Schema changes go through Flyway migrations only.

See [`CLAUDE.md`](../CLAUDE.md) for the full set of project conventions.
