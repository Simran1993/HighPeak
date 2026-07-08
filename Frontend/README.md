# HighPeak Frontend

React 18 + Vite + TypeScript, per `../FRONTEND.md`. Tailwind CSS, TanStack Query, Zustand, React Router v6, STOMP/SockJS, Leaflet + OpenStreetMap.

## Run

```bash
# 1. Start the backend first (from repo root)
docker compose up -d
cd Backend && ./gradlew bootRun

# 2. Start the frontend
cd Frontend
npm install
npm run dev        # → http://localhost:5173
```

`.env.local` already points at `http://localhost:8080/api/v1`.

## Features

- **Explore** — Instagram-style feed of itineraries other users chose to post. Like, save, open any post to view its full day-by-day itinerary on a map.
- **Trip planner** — create trips, invite members by email (OWNER/EDITOR/VIEWER roles), build day-by-day itineraries with categories, costs, and booking links. Real-time sync over WebSocket.
- **Maps** — Leaflet + OpenStreetMap background map on trip and post pages; activity locations geocoded via Nominatim (free, cached in localStorage).
- **Bookings** — deep-links to Airbnb, Booking.com, Google Flights, Skyscanner, Omio, Trainline, Rentalcars, etc., pre-filled with your destination and dates; plus a booking tracker fed by ACCOMMODATION/TRANSPORT itinerary activities.
- **Auth** — email/password + Google OAuth2, JWT with auto-refresh.

## Structure

```
src/
├── api/          Axios client (interceptors, token refresh) + one file per domain
├── components/   ui/ (Button, Input, Modal…), layout/, map/TripMap
├── features/     auth/, trips/, itinerary/, explore/, bookings/
├── hooks/        useTripSocket, useGeocode
├── lib/          queryKeys, errors, bookingLinks, geocode, utils
├── pages/        one file per route (thin — delegate to features/)
├── stores/       authStore, toastStore (Zustand)
└── types/        api.ts — mirrors backend DTOs
```

The old static prototype lives in `_prototype/`.
