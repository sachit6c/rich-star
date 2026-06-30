# CLAUDE.md

Operational guide for working in this repo.

## Project Overview

**Rich Star** — a location-aware stargazing app.

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind |
| Backend | FastAPI + Skyfield (Python) |
| Database | Supabase (PostgreSQL) — mythology content |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Local Development

### Environment Setup

```bash
# Root .env (backend)
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY, CORS_ORIGINS

# Frontend .env
cp frontend/.env.example frontend/.env
# Fill in: VITE_API_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# API at http://localhost:8000
# Skyfield downloads de421.bsp (~17 MB) on first run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

### Seed Mythology Database (one-time)

```bash
pip install -r scripts/requirements.txt
python scripts/generate_mythology.py   # ~88 Claude API calls, ~5 min — resumable
python scripts/seed_supabase.py        # upserts into Supabase
```

---

## Deployment

### Backend → Render

- Service name: `rich-star-api`
- Auto-configured via `render.yaml` (root dir: `backend`, runtime: Python)
- Add env vars in Render dashboard: `SUPABASE_URL`, `SUPABASE_KEY`, `CORS_ORIGINS` (set to Vercel URL)
- Skyfield ephemeris data persisted on a 1 GB disk at `/opt/render/project/src/data`

### Frontend → Vercel

- Root directory: `frontend`
- Build: `tsc && vite build`
- Add env var: `VITE_API_URL` → Render backend URL

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL (`https://<project>.supabase.co`) |
| `SUPABASE_KEY` | Supabase anon/service key |
| `ANTHROPIC_API_KEY` | Claude API key (used by scripts only) |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `http://localhost:5173`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:8000`) |

### Scripts (`.env`)

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for seeding (bypasses RLS) |

---

## Supabase Schema

Located at `supabase/schema.sql`. Two tables:

- `constellations` — 88 IAU constellations with RA/Dec center coordinates
- `mythology` — one row per (constellation, culture) pair; cultures: `greek`, `arabic`, `chinese`, `indigenous_australian`, `hindu`

Apply schema in the Supabase SQL editor or via the CLI.

---

## Key Files

```
backend/
  main.py          — FastAPI app entry point, CORS setup
  config.py        — env var loading
  sky.py           — real-time sky/planet/moon positions (Skyfield)
  constellation.py — constellation data + mythology queries
  satellites.py    — ISS, Hubble, Tiangong, Starlink positions
  forecast.py      — 7-night forecast logic
  darkspots.py     — dark-sky location finder

frontend/src/      — React app (Canvas 2D sky dome, views, components)

scripts/
  generate_mythology.py  — generates mythology JSON via Claude API (resumable)
  seed_supabase.py       — upserts mythology JSON into Supabase

supabase/schema.sql      — DB schema
render.yaml              — Render deploy config
```

---

## Security

- Never commit `.env` files or paste credentials in commit messages or chats.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — use only in scripts, never in frontend or backend runtime.
