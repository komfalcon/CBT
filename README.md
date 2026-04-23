# JAMB CBT

Production-grade Computer-Based Test platform scaffold for Nigerian JAMB UTME.

## Prerequisites

- Docker
- Docker Compose plugin (`docker compose`)

## Run locally

1. From the repository root:
   ```bash
   docker compose up --build
   ```
2. Open the app through nginx:
   - Frontend: http://localhost:80
   - Backend health: http://localhost:80/api/health

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
