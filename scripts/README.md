# Content Generation Pipeline

## Prerequisites

Install dependencies and set up your `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

```bash
pip install anthropic python-dotenv supabase
```

## Steps

**Step 1 — Generate mythology content**

```bash
python scripts/generate_mythology.py
```

Calls the Claude API for all 88 IAU constellations × 5 cultures and writes `scripts/mythology_data.json`. The script is resumable — re-run it after any interruption and it will skip already-processed constellations.

**Step 2 — Review the output**

Open `scripts/mythology_data.json` and spot-check a few entries. Any constellation whose `body` reads `[Content generation failed - please regenerate]` can be fixed by deleting that entry from the JSON and re-running Step 1.

**Step 3 — Seed Supabase**

```bash
python scripts/seed_supabase.py
```

Reads `mythology_data.json` and upserts all constellations and mythology entries into Supabase. Safe to re-run; all operations use `upsert` with conflict keys (`iau_abbr` for constellations, `constellation_id + culture` for mythology).
