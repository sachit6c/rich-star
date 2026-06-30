# Stargazing & Constellations — Project Plan

A free, open-source, location-aware stargazing application that shows what's visible in your night sky and tells the cultural stories behind it — with deep emphasis on mythology across cultures, including Hindu traditions.

---

## Guiding Principles

- **Entirely free.** No paid APIs, no paid hosting, no licensing costs. Open-source tools and free public data only.
- **Built with LLM agents.** The project is designed to be assembled using LLMs and agent mode, with work broken into clear, self-contained blocks.
- **Logical and deep.** Cultural and mythological content should be substantive and well-researched — not vague or generic. Multiple cultures, side by side, for the same patch of sky.
- **Location-first.** Everything keys off the user's geographic location and the current (or chosen) date and time.

---

## Core Data Blocks

The application is built on four foundational data blocks.

### 1. Celestial Positioning
Real-time positions of stars, planets, the Moon, and the Sun, calculated from the user's coordinates and the current date/time. This determines *what is actually visible* from a given place at a given moment.

### 2. Multi-Cultural Constellation Mythology
The heart of the project. For each constellation or star group, store the interpretations of multiple cultures, including:
- **Greek** — the classical Western canon (Orion, Cassiopeia, etc.)
- **Arabic** — star names and traditions (many modern star names are Arabic in origin)
- **Chinese** — the traditional Chinese sky divisions and asterisms
- **Indigenous Australian** — distinct sky stories and seasonal markers
- **Hindu** — the **Nakshatras** (27 lunar mansions), their presiding deities, seasonal and astrological significance, plus related stories and fun facts

The goal: clicking on Orion shows not one story, but how each culture saw and named that same set of stars.

### 3. Satellite & Space Station Tracking
Positions and visible passes of the International Space Station and other satellites, so the user knows when to look up and where.

### 4. Visualization Layer
The interactive front-end that displays positioning, mythology, and satellite data together in an explorable way.

---

## How the Data Is Consumed

Three main experiences for the user.

### A. Interactive Web Interface
- User inputs their **location**.
- Displays an interactive sky map of what's around them.
- **Click a constellation or star → see all the stories** attached to it, across every culture in the database.

### B. Real-Time Sky View
- Shows what is currently visible above the user's location right now.
- Identifies the most visible celestial bodies for that specific shape of sky at that specific location.

### C. Weekly Forecast & Viewing Locations
- A **weekly dump** of what to expect in the sky over the coming seven days.
- Recommends the **best viewing spots within ~40–50 miles** of home, factoring in light pollution and geography, and notes which celestial bodies are visible across the week.

---

## Suggested Free Tools & Data Sources

> Indicative only — chosen because they are free and open. Swap as needed.

| Need | Free Option |
|------|-------------|
| Star & planet positions | **Skyfield** (Python astronomy library) |
| Bright star catalog | **Yale Bright Star Catalog** (open dataset) |
| Satellite / ISS tracking | **CelesTrak** (free TLE data), **N2YO** |
| Space / astronomy data | **NASA public APIs** (APOD, etc.) |
| Light pollution data | Open light-pollution datasets / maps |
| Front-end | **React** or **Vue** |
| Hosting | **Netlify** or **Vercel** (free tiers) |
| Mythology content | Researched & generated with LLM agents, sourced from open references |

---

## Project Phases

### Phase 1 — Data Pipeline Foundation
Aggregate the core inputs: celestial positions (location + time), the multi-cultural mythology database (Greek, Arabic, Chinese, Indigenous Australian, Hindu/Nakshatras), and satellite tracking. Serve it all as structured data (e.g. JSON) for the front-end to consume.

### Phase 2 — Interactive Web Interface
Build the location-input web platform with the interactive sky map. Implement click-to-explore: selecting any constellation or star surfaces all of its cultural stories and fun facts. Add the real-time sky view.

### Phase 3 — Weekly Forecast Engine
Generate the seven-day visibility forecast for the user's location — what to expect, night by night.

### Phase 4 — Viewing Location Recommendations
Layer in light-pollution and geographic data to recommend the best stargazing spots within 40–50 miles for the week ahead.

### Phase 5 — Polish, Test & Deploy
Refine the interface, validate accuracy of positions and forecasts, test across locations, and deploy to free hosting.

---

## Build Approach with LLM Agents

Each phase — and each data block within it — is self-contained enough to hand to an agent as a discrete task:
- **Research/content agents** generate and structure the multi-cultural mythology (especially the deep Hindu/Nakshatra material).
- **Technical agents** handle the positioning pipeline, satellite integration, forecast logic, and front-end build.

This lets you assign the right kind of work to the right model and assemble the project block by block.

---

## Next Decisions to Make

1. Confirm the exact cultures and depth of mythology for the first version.
2. Pick the front-end framework (React vs Vue).
3. Decide whether v1 is your single home location or works for any location.
4. Choose which light-pollution dataset to use for Phase 4.
