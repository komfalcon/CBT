# JAMB CBT

Production-grade Computer-Based Test platform scaffold for Nigerian JAMB UTME.

## Prerequisites

- Docker
- Docker Compose plugin (`docker compose`)

## Run locally

1. **Start the databases** (from the root directory):
   ```bash
   docker compose up -d
   ```
2. **Start the backend API** (in a new terminal):
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
3. **Start the frontend UI** (in another terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
Your backend will run at http://localhost:3000 and your frontend at http://localhost:5173.

## Verify health check

Run:

```bash
curl http://localhost:80/api/health
```

Expected shape:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected",
    "elasticsearch": "connected"
  }
}
```

`services` values will return `disconnected` when dependencies are unavailable.

## Project layout

- `/frontend` — React + Vite + Tailwind scaffold
- `/backend` — NestJS scaffold + `/health`
- `/docker-compose.yml` — local multi-service stack
- `/.do/app.yaml` — DigitalOcean App Platform spec
- `/frontend/wrangler.toml` — Cloudflare Pages config
