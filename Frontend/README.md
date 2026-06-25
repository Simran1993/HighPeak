# HighPeak — Demo Frontend

A **throwaway, zero-build demo** for poking at the HighPeak backend in a browser.
It is intentionally simple so it can be deleted and replaced by the real
**React + Vite + TypeScript** stack described in [`../FRONTEND.md`](../FRONTEND.md)
once the project scales.

- **No `npm install`, no bundler.** `index.html` is a single-file React 18 app
  loaded as native ES modules from a CDN (`esm.sh`) with `htm` for JSX-style
  templates and Tailwind via CDN.
- **`server.mjs`** is a tiny Node server (built-ins only) that serves the page
  and **proxies `/api/*` to the backend**. This sidesteps the fact that the
  backend currently has no CORS config — the browser only ever talks to this
  server (same origin), and the proxy forwards calls server-to-server.

## Run it

```bash
# 1. Start the backend infra + app (from repo root / Backend)
docker compose up -d
cd ../Backend && ./gradlew bootRun        # backend on :8080

# 2. Start this demo (from Frontend/)
cd ../Frontend && node server.mjs         # demo on http://localhost:5173
```

Then open <http://localhost:5173> and register/log in.

Override the backend target if needed:

```bash
BACKEND_URL=http://localhost:9090 PORT=3000 node server.mjs
```

## What it covers

Auth (register / login / logout / refresh), trips (list / create / edit /
delete), members (list / remove / leave), invites (send / list / revoke), and
the full itinerary (days + activities with categories, cost, booking links).
Role-based controls follow `myRole`.

Not included (deliberately, per the "wire it last" note in `FRONTEND.md`):
real-time WebSocket updates and the Google OAuth callback page — the "Continue
with Google" button kicks off the flow but the callback lands on the backend's
configured `FRONTEND_URL`.
