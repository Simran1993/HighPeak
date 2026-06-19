# Frontend Planning Document

Read this fully before writing a single line of code. Every decision here affects the whole project — changing them mid-way is expensive.

---

## 1. Tech Stack Decisions

### Framework — React + Vite
- **React 18** with Vite (the backend's `FRONTEND_URL` already defaults to `http://localhost:5173`, which is Vite's default port)
- **TypeScript** — not optional. The backend returns typed DTOs; mirroring them in TypeScript catches bugs before they hit the API.

### Routing — React Router v6
- File-based routing is not needed at this scale. React Router v6 with a central `routes.tsx` is sufficient.

### Styling — Tailwind CSS + shadcn/ui
- Tailwind for utility classes
- shadcn/ui for pre-built accessible components (buttons, modals, forms, toasts) — these are copy-pasted into your codebase, not a runtime dependency, so you own them fully
- No other UI library. Do not mix component libraries.

### State Management — Zustand + React Query
- **React Query (TanStack Query v5)** for all server state — API calls, caching, background refetching, loading/error states. Do not use `useEffect` + `useState` for data fetching.
- **Zustand** for global client state only — currently just the auth store (current user, tokens).
- Do not use Redux. Do not use Context API for anything beyond theme/locale if needed.

### WebSocket — @stomp/stompjs + sockjs-client
- These are the official client libraries for the STOMP/SockJS backend.
- Wrap the connection in a single custom hook `useTripSocket(tripId)` that subscribes to `/topic/trips/{tripId}` and invalidates React Query caches on events.

### HTTP Client — Axios
- Single Axios instance with a request interceptor to attach `Authorization: Bearer <token>` automatically.
- Response interceptor to handle 401 (token expired) → auto-refresh → retry original request.

### Forms — React Hook Form + Zod
- React Hook Form for form state management.
- Zod for schema validation — mirrors the backend's Jakarta Bean Validation rules.

---

## 2. Project Structure

```
Frontend/
├── public/
├── src/
│   ├── api/              # Axios instance + one file per domain
│   │   ├── client.ts     # Axios setup, interceptors, token refresh logic
│   │   ├── auth.ts
│   │   ├── trips.ts
│   │   ├── itinerary.ts
│   │   └── invites.ts
│   ├── components/       # Reusable UI components (not tied to a page)
│   │   ├── ui/           # shadcn/ui generated components live here
│   │   └── layout/       # Navbar, Sidebar, PageWrapper, etc.
│   ├── features/         # Feature-scoped components, hooks, and types
│   │   ├── auth/
│   │   ├── trips/
│   │   ├── itinerary/
│   │   └── invites/
│   ├── hooks/            # Shared custom hooks (useTripSocket, useDebounce, etc.)
│   ├── pages/            # One file per route — thin, delegates to features/
│   ├── stores/           # Zustand stores
│   │   └── authStore.ts
│   ├── types/            # TypeScript types mirroring backend DTOs
│   │   └── api.ts
│   ├── lib/              # Utility functions (date formatting, currency, etc.)
│   ├── routes.tsx         # Central route definitions
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local            # VITE_API_URL, VITE_WS_URL — never commit this
```

**Rule:** Pages are dumb. A page file imports a feature component and renders it. Business logic lives in `features/`, not `pages/`.

---

## 3. Environment Variables

Vite exposes only variables prefixed with `VITE_`.

```bash
# .env.local (dev)
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=http://localhost:8080/api/v1/ws

# .env.production
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_WS_URL=https://api.yourdomain.com/api/v1/ws
```

---

## 4. TypeScript Types (mirror backend DTOs exactly)

Define these in `src/types/api.ts` before building any feature. Every API call returns one of these shapes.

```typescript
// Auth
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
}

// User
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
}

// Trips
export type TripStatus = 'DRAFT' | 'PUBLISHED';
export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface TripResponse {
  id: string;
  title: string;
  description: string | null;
  destination: string | null;
  startDate: string | null;   // YYYY-MM-DD
  endDate: string | null;
  status: TripStatus;
  myRole: MemberRole;
  memberCount: number;
  createdBy: string;
  createdAt: string;          // ISO timestamp
  updatedAt: string;
}

export interface TripSummaryResponse {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status: TripStatus;
  myRole: MemberRole;
}

export interface TripMemberResponse {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string;
}

// Itinerary
export type ActivityCategory =
  | 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD'
  | 'SIGHTSEEING' | 'ACTIVITY' | 'SHOPPING' | 'OTHER';

export interface ActivityResponse {
  id: string;
  dayId: string;
  title: string;
  startTime: string;          // HH:mm:ss
  location: string;
  notes: string;
  cost: number | null;
  category: ActivityCategory | null;
  bookingLink: string | null;
}

export interface DayResponse {
  id: string;
  tripId: string;
  date: string;               // YYYY-MM-DD
  notes: string | null;
  activities: ActivityResponse[];
}

// Invites
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface InviteResponse {
  id: string;
  tripId: string;
  tripTitle: string;
  invitedEmail: string;
  invitedByName: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

// WebSocket
export type TripEventType =
  | 'TRIP_UPDATED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'MEMBER_LEFT'
  | 'DAY_ADDED' | 'DAY_DELETED'
  | 'ACTIVITY_ADDED' | 'ACTIVITY_UPDATED' | 'ACTIVITY_DELETED';

export interface TripEvent {
  type: TripEventType;
  tripId: string;
  payload: unknown;
  actorId: string;
  timestamp: string;
}

// API errors
export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
```

---

## 5. Pages and Routes

| Path | Page | Auth required |
|------|------|:---:|
| `/` | Redirect to `/dashboard` if logged in, else `/login` | — |
| `/login` | Login form + Google OAuth2 button | No |
| `/register` | Register form | No |
| `/auth/callback` | OAuth2 redirect handler (reads `?accessToken=&refreshToken=` from URL) | No |
| `/dashboard` | List of all user's trips | Yes |
| `/trips/new` | Create trip form | Yes |
| `/trips/:id` | Trip detail — overview, members tab, itinerary tab | Yes |
| `/trips/:id/edit` | Edit trip form | Yes (OWNER/EDITOR) |
| `/invites/:token/accept` | Invite accept page | Yes |

---

## 6. Auth Flow

### Token Storage
Store tokens in **`localStorage`**. Do not use cookies (the backend does not set cookies for JWT; it returns tokens in the response body).

```typescript
// authStore.ts (Zustand)
interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
}
```

### Axios Interceptors (implement these before any API call)

**Request interceptor** — attach token:
```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Response interceptor** — auto-refresh on 401:
```typescript
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      // call POST /auth/refresh, update store, retry request
    }
    return Promise.reject(error);
  }
);
```

### Google OAuth2 Flow
1. User clicks "Continue with Google"
2. Redirect to `{VITE_API_URL}/oauth2/authorization/google` — the backend handles everything
3. Backend redirects to `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...`
4. The `/auth/callback` page reads the query params, saves to store, redirects to `/dashboard`

### Protected Routes
Wrap protected routes in a `<RequireAuth>` component that checks `authStore.accessToken`. If null, redirect to `/login`.

---

## 7. WebSocket Hook

Implement `useTripSocket` in `src/hooks/useTripSocket.ts`. It should:
1. Connect on mount, disconnect on unmount
2. Subscribe to `/topic/trips/{tripId}`
3. On each message, parse the `TripEvent` and call `queryClient.invalidateQueries` for the relevant query key
4. Only connect when the user is on a trip detail page (passes `tripId`)

```typescript
// Query keys to invalidate per event type
TRIP_UPDATED       → ['trip', tripId]
MEMBER_ADDED/REMOVED/LEFT → ['trip', tripId, 'members']
DAY_ADDED/DELETED  → ['trip', tripId, 'itinerary']
ACTIVITY_*         → ['trip', tripId, 'itinerary']
```

---

## 8. React Query Setup

Define query keys as constants — not inline strings — so invalidation is consistent:

```typescript
export const queryKeys = {
  trips: () => ['trips'] as const,
  trip: (id: string) => ['trip', id] as const,
  tripMembers: (id: string) => ['trip', id, 'members'] as const,
  itinerary: (tripId: string) => ['trip', tripId, 'itinerary'] as const,
  pendingInvites: (tripId: string) => ['trip', tripId, 'invites'] as const,
};
```

---

## 9. Error Handling

- Axios errors → extract `error.response.data as ErrorResponse`
- Show toast notifications for 4xx errors (user-facing messages)
- 401 with no refresh token → clear store, redirect to `/login`
- 403 → show "You don't have permission" inline, not a redirect
- 404 → show a not-found state within the page, not a redirect
- 500 → show a generic error toast

Use a single `handleApiError(error)` utility in `src/lib/errors.ts` so every feature handles errors the same way.

---

## 10. Role-Based UI Rules

The backend enforces permissions — but the UI should also hide/disable actions the user can't perform.

| Action | Show to |
|--------|---------|
| Edit trip details | OWNER, EDITOR |
| Delete trip | OWNER only |
| Invite members | OWNER, EDITOR |
| Revoke invites | OWNER, EDITOR |
| Remove a member | OWNER only |
| Add/edit/delete days and activities | OWNER, EDITOR |
| Leave trip button | EDITOR, VIEWER |

Use `myRole` from `TripResponse` to conditionally render these controls.

---

## 11. Setup Commands (run these before writing any feature code)

```bash
cd Frontend

# Scaffold
npm create vite@latest . -- --template react-ts

# Core dependencies
npm install react-router-dom @tanstack/react-query axios zustand
npm install @stomp/stompjs sockjs-client
npm install react-hook-form zod @hookform/resolvers

# Dev / styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui (run after Tailwind is configured)
npx shadcn@latest init
```

---

## 12. Build Order

Build features in this order — each one depends on the previous:

1. **Axios client + interceptors** — everything else uses this
2. **Auth store (Zustand)** — needed by the interceptor and route guards
3. **Login / Register / OAuth2 callback pages** — needed to get a token for testing
4. **Protected route wrapper**
5. **Dashboard — trip list**
6. **Create / Edit trip**
7. **Trip detail page (overview + members tab)**
8. **Invite flow** (send, view pending, accept via link)
9. **Itinerary tab** (days + activities)
10. **WebSocket hook** — wire in last, after all React Query keys are settled
