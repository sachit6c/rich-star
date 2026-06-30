"""
FastAPI router for /constellation/{iau_abbr}.

Queries Supabase for constellation metadata and multi-culture mythology.
Falls back to mock data when SUPABASE_URL is not configured.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from backend.config import SUPABASE_KEY, SUPABASE_URL

router = APIRouter()

# ---------------------------------------------------------------------------
# Mock data (dev / no-Supabase mode)
# ---------------------------------------------------------------------------

_MOCK_CONSTELLATION = {"iau_abbr": "ORI", "name": "Orion"}

_MOCK_MYTHOLOGY: list[dict[str, Any]] = [
    {
        "culture": "greek",
        "title": "The Hunter",
        "body": (
            "Orion was a giant huntsman placed among the stars by Zeus after his death. "
            "He was the son of Poseidon and famed for his beauty and hunting skill. "
            "The goddess Artemis either loved him or accidentally killed him — accounts differ."
        ),
        "deity": "Zeus / Artemis",
        "fun_fact": "The three belt stars are sometimes called the 'Three Kings' or 'Three Sisters' in different cultures.",
    },
    {
        "culture": "egyptian",
        "title": "Osiris in the Sky",
        "body": (
            "The ancient Egyptians identified Orion's belt with Osiris, god of the afterlife. "
            "The three pyramids of Giza are famously aligned to mirror the belt stars."
        ),
        "deity": "Osiris",
        "fun_fact": "The Pyramid Texts (c. 2400 BCE) associate the pharaoh's soul with Orion as a path to immortality.",
    },
    {
        "culture": "mesopotamian",
        "title": "The Loyal Shepherd",
        "body": (
            "In Babylonian astronomy Orion was known as MUL.SIPA.ZI.AN.NA, "
            "the 'True Shepherd of Anu.' He was a faithful guardian of the celestial flock."
        ),
        "deity": "Anu",
        "fun_fact": "Babylonian star catalogues from around 1200 BCE already recorded this constellation.",
    },
    {
        "culture": "mayan",
        "title": "The Three Hearthstones",
        "body": (
            "The Maya saw Orion's belt stars and the Orion Nebula as the three hearthstones of creation, "
            "the fireplace at the center of the sky where life was kindled at the start of the current world age."
        ),
        "deity": "Hunahpu",
        "fun_fact": "The Orion Nebula (M42) was the 'smoky' fire rising from those cosmic hearthstones.",
    },
    {
        "culture": "chinese",
        "title": "Shen — the Three Stars",
        "body": (
            "In Chinese astronomy Orion's belt formed the asterism Shēn (參), representing a white tiger "
            "and one of the 28 lunar mansions. The belt was the 'Three Stars' of the western palace."
        ),
        "deity": "Bai Hu (White Tiger)",
        "fun_fact": "Shēn was said to be in perpetual conflict with Bi (Hyades/Taurus) — the two never appear in the sky at the same time.",
    },
]


def _mock_for(iau_abbr: str) -> dict[str, Any]:
    """Return placeholder data for any constellation not in Supabase."""
    return {
        "constellation": {"iau_abbr": iau_abbr.upper(), "name": iau_abbr.upper()},
        "mythology": [],
    }


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.get("/constellation/{iau_abbr}")
def get_constellation(iau_abbr: str) -> dict[str, Any]:
    """
    Return constellation metadata and multi-culture mythology stories.

    Uses Supabase when credentials are configured, otherwise returns mock
    data (useful during local development without a database).
    """
    iau_upper = iau_abbr.upper()

    # --- dev / no-credentials fallback ---
    if not SUPABASE_URL:
        if iau_upper == "ORI":
            return {
                "constellation": _MOCK_CONSTELLATION,
                "mythology": _MOCK_MYTHOLOGY,
            }
        return _mock_for(iau_upper)

    # --- Supabase path ---
    try:
        from supabase import Client, create_client  # type: ignore[import]
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="supabase-py is not installed. Run: pip install supabase",
        ) from exc

    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Query constellation row
    con_resp = (
        client.table("constellations")
        .select("iau_abbr, name")
        .eq("iau_abbr", iau_upper)
        .single()
        .execute()
    )

    if not con_resp.data:
        raise HTTPException(status_code=404, detail=f"Constellation '{iau_upper}' not found.")

    constellation_row: dict[str, Any] = con_resp.data

    # Query mythology rows (up to 5 cultures)
    myth_resp = (
        client.table("mythology")
        .select("culture, title, body, deity, fun_fact")
        .eq("iau_abbr", iau_upper)
        .limit(5)
        .execute()
    )

    mythology_rows: list[dict[str, Any]] = myth_resp.data or []

    return {
        "constellation": constellation_row,
        "mythology": mythology_rows,
    }
