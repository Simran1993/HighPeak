# 🏔️ HighPeak

**A collaborative trip‑planning platform** — plan itineraries together in real time, invite friends, share your trips to a social feed, chat, track flights, and keep travel documents in an encrypted vault.

<p align="center">
  <img alt="Java" src="https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white">
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white">
</p>

> ⚠️ **Demo / portfolio project.** Data may be reset at any time. Please don't store anything important.

---

## 🔗 Live Demo

- **App:** https://highpeak.up.railway.app/login

> Deployed on [Railway](https://railway.com) (backend + frontend + PostgreSQL + Redis).

---

## ✨ Features

- **Collaborative trips** — create trips and invite others with per‑member roles (`OWNER`, `EDITOR`, `VIEWER`).
- **Real‑time collaboration** — itinerary edits, new members, and chat messages sync live over WebSocket (STOMP), so everyone sees changes instantly.
- **Itinerary planner** — organize days and activities by category, with an interactive Leaflet map.
- **Invites** — time‑limited invite links (7 days) delivered by email *and* as in‑app notifications; accepting adds the invitee to the trip automatically.
- **🔔 Notification center** — real‑time notifications for trip invites, post likes, and when someone accepts your invite, with an unread badge and a bell dropdown.
- **Explore feed** — publish a finished trip as a post, then browse, like, and save other travelers' itineraries.
- **Trip chat** — per‑trip messaging with file attachments.
- **✈️ Flight tracker** — live flight positions via the OpenSky Network.
- **🔐 Document vault** — upload travel documents stored **encrypted at rest** (AES‑256‑GCM).
- **Profiles** — avatar upload, bio, and travel interests.
- **Authentication** — email/password with JWT access + refresh tokens (refresh tokens tracked in Redis), plus **Google OAuth 2.0** sign‑in.

---

## 🧱 Tech Stack

### Backend (`/Backend`)
- **Java 21**, **Spring Boot 3.5**
- **Spring Security** — stateless JWT ([jjwt](https://github.com/jwtk/jjwt)) + Google OAuth2 client
- **Spring Data JPA** on **PostgreSQL 16**, schema managed by **Flyway** migrations
- **Redis 7** — refresh‑token / session storage
- **WebSocket (STOMP)** — real‑time trip & notification events
- **Spring Mail** — invite emails (MailHog in dev)
- **SpringDoc / Swagger UI** — API docs
- **Testcontainers** — integration tests against a real PostgreSQL
- Lombok · Bean Validation

### Frontend (`/Frontend`)
- **React 18** + **TypeScript** + **Vite 5**
- **TanStack Query** (server state) · **Zustand** (client state)
- **React Router 6** · **Tailwind CSS** · **lucide-react** icons
- **@stomp/stompjs** + **sockjs-client** — live updates
- **Leaflet / react-leaflet** — maps
- **react-hook-form** + **zod** — forms & validation
- **axios** — API client with automatic token refresh

### Infrastructure
- **Docker Compose** — PostgreSQL, Redis, and MailHog for local dev
- **Railway** — production hosting

---

## 🏛️ Architecture

```
┌─────────────┐        REST + WebSocket (STOMP)        ┌──────────────────┐
│   React /   │  ───────────────────────────────────▶  │   Spring Boot    │
│   Vite SPA  │  ◀───────────────────────────────────  │   API (/api/v1)  │
└─────────────┘         JWT (Bearer) / SockJS           └───────┬──────────┘
                                                                │
                              ┌─────────────────────────────────┼───────────────┐
                              ▼                                 ▼               ▼
                        ┌───────────┐                     ┌───────────┐   ┌───────────┐
                        │PostgreSQL │                     │   Redis   │   │   SMTP    │
                        │ (Flyway)  │                     │ (tokens)  │   │ (invites) │
                        └───────────┘                     └───────────┘   └───────────┘
```

- **DDL is Flyway‑only** (`ddl-auto: validate`) — every schema change is a versioned migration in `Backend/src/main/resources/db/migration`.
- **Layered design** — thin controllers, business logic in services, persistence in repositories; entities never leave the service layer (DTOs everywhere).
- **Dual auth** — stateless JWT for the REST API and Spring's OAuth2 client for Google login, both issuing a JWT the frontend stores and sends as `Authorization: Bearer <token>`.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **JDK 21**
- **Node.js 20+**
- **Docker** (for PostgreSQL, Redis, MailHog)

### 1. Start infrastructure
From the repo root:
```bash
docker compose up -d          # PostgreSQL :5432 · Redis :6379 · MailHog :8025
```

### 2. Run the backend
```bash
cd Backend
./gradlew bootRun
```
The API starts at **http://localhost:8080/api/v1**.
- Swagger UI: http://localhost:8080/api/v1/swagger-ui.html
- MailHog (catches invite emails): http://localhost:8025

> Every config value has a `localhost` default, so the backend runs with no extra setup once Docker is up.

### 3. Run the frontend
```bash
cd Frontend
npm install
npm run dev                   # http://localhost:5173
```
Create `Frontend/.env.local` if you need to point at a different API:
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=http://localhost:8080/api/v1/ws
```

---

## ⚙️ Configuration

The backend reads everything from environment variables (with sensible localhost defaults):

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | `localhost/5432/tp-backend/...` | PostgreSQL connection |
| `DATABASE_URL` | _(unset)_ | Alternative single‑URL Postgres config (e.g. Railway) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | `localhost/6379` | Redis |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` | `localhost/1025` | SMTP for invite emails |
| `JWT_SECRET` | dev placeholder | JWT signing secret (**set a strong value in prod**) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | _(empty)_ | Google OAuth2 (login is disabled if unset) |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin + OAuth/invite redirects |
| `FILE_ENCRYPTION_KEY` | falls back to `JWT_SECRET` | Key for encrypting vault documents at rest |

> For Google sign‑in, register the redirect URI `<backend-url>/login/oauth2/code/google` in the Google Cloud Console.

---

## 📂 Project Structure

```
HighPeak/
├── Backend/                     # Spring Boot API
│   └── src/main/java/com/travelit/backend/
│       ├── auth/  user/  trip/  itinerary/  invite/
│       ├── message/  post/  file/  vault/  notification/
│       ├── security/            # JWT, OAuth2, filters
│       └── websocket/           # STOMP config & event publishing
├── Frontend/                    # React + Vite SPA
│   └── src/  (pages · features · components · api · hooks · stores)
├── docker-compose.yml           # Postgres · Redis · MailHog
└── README.md
```

---

## 🧪 Testing

```bash
cd Backend
./gradlew test                  # integration tests run against a Testcontainers PostgreSQL
```

---

## 📖 API Documentation

Interactive API docs (Swagger UI) are available in local/dev at:
```
http://localhost:8080/api/v1/swagger-ui.html
```
See also [`API_DOCS.md`](./API_DOCS.md) for a written overview of the endpoints.

---

## 📸 Screenshots

<!-- Add screenshots / a short GIF here to show off the app.
     e.g. ![Explore feed](docs/screenshots/explore.png) -->

---

## 📝 License

This project is a personal/portfolio demo. Add a `LICENSE` file if you intend others to reuse it.
