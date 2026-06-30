# Rich Star — Stargazing App

A free, open-source, location-aware stargazing app. Shows your real-time night sky, lets you tap constellations to read mythology from 5 cultures, tracks the ISS and satellites, generates a 7-night forecast, and finds dark-sky spots near you.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Canvas 2D sky dome + Tailwind |
| Backend | FastAPI + Skyfield (Python) |
| Database | Supabase (PostgreSQL) — mythology content |
| Deploy | Vercel (frontend) + Render (backend) |

All tools and data sources are free and open-source.

---

## Local Development

### Prerequisites
- Python 3.11+
- Node 18+
- Supabase project (free tier)

### 1. Clone and configure

```bash
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY, CORS_ORIGINS
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
# Skyfield downloads de421.bsp (~17 MB) on first run
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

### 4. Seed mythology database (one-time)

```bash
pip install -r scripts/requirements.txt
python scripts/generate_mythology.py   # ~88 Claude API calls, ~5 min
python scripts/seed_supabase.py        # upserts into Supabase
```

See `scripts/README.md` for details.

---

## Deploy

### Backend → Render

1. Connect this repo to [Render](https://render.com)
2. Render auto-detects `render.yaml` and creates the web service
3. Add env vars in Render dashboard: `SUPABASE_URL`, `SUPABASE_KEY`, `CORS_ORIGINS` (set to your Vercel URL)

### Frontend → Vercel

1. Connect this repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add env var: `VITE_API_URL` → your Render backend URL

---

## Features

- **Sky map** — real-time azimuthal dome showing what's above you now. Tap any constellation to read mythology across 5 cultures (Greek, Arabic, Chinese, Indigenous Australian, Hindu/Nakshatras). Drag to pan, pinch to zoom. Date/time picker for time travel.
- **Forecast** — 7-night view: darkness windows, moon phase, visible planets, ISS pass schedule, meteor shower alerts.
- **Dark spots** — finds the 5 darkest sky locations within 50 miles of you using light pollution data. Links directly to Google Maps for directions.
- **Satellites** — ISS, Hubble, Tiangong, and Starlink highlights: current position + next visible pass.
