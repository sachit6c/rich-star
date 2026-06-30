import json
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from project root (parent of scripts/)
_project_root = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(_project_root, ".env"))

MYTHOLOGY_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "mythology_data.json")


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if not url or not key:
        print(
            "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) must be set in .env",
            file=sys.stderr,
        )
        sys.exit(1)
    return create_client(url, key)


def load_mythology_data() -> list:
    if not os.path.exists(MYTHOLOGY_FILE):
        print(f"Error: {MYTHOLOGY_FILE} not found. Run generate_mythology.py first.", file=sys.stderr)
        sys.exit(1)
    with open(MYTHOLOGY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def upsert_constellation(supabase: Client, iau_abbr: str, name: str) -> str | None:
    """Upsert a constellation row and return its UUID."""
    try:
        response = (
            supabase.table("constellations")
            .upsert({"iau_abbr": iau_abbr, "name": name}, on_conflict="iau_abbr")
            .execute()
        )
        if response.data:
            return response.data[0]["id"]
        # Fallback: fetch the row if upsert returns empty data
        fetch_response = (
            supabase.table("constellations")
            .select("id")
            .eq("iau_abbr", iau_abbr)
            .single()
            .execute()
        )
        if fetch_response.data:
            return fetch_response.data["id"]
        print(f"  Warning: could not retrieve ID for {iau_abbr}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  Error upserting constellation {iau_abbr}: {e}", file=sys.stderr)
        return None


def upsert_mythology_entry(
    supabase: Client,
    constellation_id: str,
    iau_abbr: str,
    entry: dict,
) -> bool:
    """Upsert a mythology entry for a given constellation and culture."""
    culture = entry.get("culture")
    record = {
        "constellation_id": constellation_id,
        "culture": culture,
        "title": entry.get("title"),
        "body": entry.get("body"),
        "deity": entry.get("deity"),
        "fun_fact": entry.get("fun_fact"),
    }
    try:
        supabase.table("mythology").upsert(
            record, on_conflict="constellation_id,culture"
        ).execute()
        return True
    except Exception as e:
        print(f"  Error upserting mythology entry ({iau_abbr}/{culture}): {e}", file=sys.stderr)
        return False


def main():
    supabase = get_supabase_client()
    data = load_mythology_data()
    total = len(data)

    print(f"Seeding {total} constellations into Supabase...\n")

    constellation_successes = 0
    mythology_successes = 0
    mythology_total = 0

    for idx, constellation in enumerate(data, start=1):
        iau_abbr = constellation["iau_abbr"]
        name = constellation["name"]
        entries = constellation.get("entries", [])

        print(f"[{idx}/{total}] Upserting {name} ({iau_abbr})...")

        constellation_id = upsert_constellation(supabase, iau_abbr, name)
        if not constellation_id:
            print(f"  Skipping mythology entries for {name} — no constellation ID.")
            continue

        constellation_successes += 1

        for entry in entries:
            mythology_total += 1
            culture = entry.get("culture", "unknown")
            success = upsert_mythology_entry(supabase, constellation_id, iau_abbr, entry)
            if success:
                mythology_successes += 1
                print(f"    OK  {culture}")
            else:
                print(f"    FAIL  {culture}")

    print(
        f"\nDone!"
        f"\n  Constellations upserted: {constellation_successes}/{total}"
        f"\n  Mythology entries upserted: {mythology_successes}/{mythology_total}"
    )


if __name__ == "__main__":
    main()
