"""
FastAPI router for /satellites.

Fetches TLE data from CelesTrak, computes current az/alt for each satellite,
and finds the next visible pass within 24 hours.

TLE data is cached module-level and refreshed every 6 hours.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from skyfield.api import EarthSatellite, wgs84

from backend.sky import ts  # reuse the shared timescale

router = APIRouter()
utc = timezone.utc

# ---------------------------------------------------------------------------
# Satellite definitions (name → NORAD catalog number)
# ---------------------------------------------------------------------------

_SATELLITES: list[dict[str, Any]] = [
    {"label": "ISS (ZARYA)",  "norad": 25544},
    {"label": "HST",          "norad": 20580},
    {"label": "CSS (Tianhe)", "norad": 48274},
    {"label": "STARLINK-1130","norad": 44743},
]

_CELESTRAK_TLE_URL = "https://celestrak.org/satcat/tle.php?CATNR={norad}"

# ---------------------------------------------------------------------------
# TLE cache
# ---------------------------------------------------------------------------

_tle_cache: dict[int, dict[str, Any]] = {}   # norad → {name, line1, line2, fetched_at}
_CACHE_TTL_SECONDS = 6 * 3600                 # 6 hours


def _fetch_tle(norad: int) -> tuple[str, str, str]:
    """Fetch TLE lines from CelesTrak. Returns (name, line1, line2)."""
    url = _CELESTRAK_TLE_URL.format(norad=norad)
    try:
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CelesTrak fetch failed for NORAD {norad}: {exc}") from exc

    lines = [ln.strip() for ln in response.text.strip().splitlines() if ln.strip()]
    if len(lines) < 3:
        raise HTTPException(status_code=502, detail=f"Unexpected TLE response for NORAD {norad}: {response.text[:200]}")

    name = lines[0]
    line1 = lines[1]
    line2 = lines[2]
    return name, line1, line2


def _get_tle(norad: int, label: str) -> EarthSatellite:
    """Return a Skyfield EarthSatellite, using the cache where possible."""
    now = time.monotonic()
    cached = _tle_cache.get(norad)

    if cached is None or (now - cached["fetched_at"]) > _CACHE_TTL_SECONDS:
        try:
            name, line1, line2 = _fetch_tle(norad)
        except HTTPException:
            # If the fetch fails and we have stale data, use it
            if cached:
                return cached["satellite"]
            raise
        satellite = EarthSatellite(line1, line2, name, ts)
        _tle_cache[norad] = {
            "satellite": satellite,
            "fetched_at": now,
        }
        return satellite

    return cached["satellite"]


# ---------------------------------------------------------------------------
# Pass prediction helpers
# ---------------------------------------------------------------------------

_SAMPLE_STEP_SECONDS = 30
_HORIZON_HOURS = 24
_VISIBLE_ALT_DEG = 10.0


def _find_next_pass(
    satellite: EarthSatellite,
    observer: Any,
    t_start: Any,
) -> dict[str, Any] | None:
    """
    Scan the next 24 hours in 30-second steps to find the next pass where
    alt > VISIBLE_ALT_DEG. Returns a dict with rise_time, max_alt, set_time
    (all ISO strings) or None if no pass found.
    """
    total_steps = int(_HORIZON_HOURS * 3600 / _SAMPLE_STEP_SECONDS)
    start_unix = t_start.tt  # Terrestrial Time (close enough for sampling)

    # Build time array
    from skyfield.api import load as _load  # avoid re-importing at top level

    step_days = _SAMPLE_STEP_SECONDS / 86400.0

    # Sample altitudes over 24 h
    in_pass = False
    rise_t: Any = None
    max_alt_deg = 0.0
    max_t: Any = None

    for i in range(total_steps):
        t_i = ts.tt_jd(start_unix + i * step_days)
        difference = satellite - observer
        topocentric = difference.at(t_i)
        alt, az, _ = topocentric.altaz()

        above = alt.degrees > _VISIBLE_ALT_DEG

        if above and not in_pass:
            # Start of pass
            in_pass = True
            rise_t = t_i
            max_alt_deg = alt.degrees
            max_t = t_i

        elif above and in_pass:
            if alt.degrees > max_alt_deg:
                max_alt_deg = alt.degrees
                max_t = t_i

        elif not above and in_pass:
            # End of pass
            set_t = t_i
            return {
                "rise_time": _sky_time_to_iso(rise_t),
                "max_alt": round(max_alt_deg, 1),
                "set_time": _sky_time_to_iso(set_t),
            }

    # Pass extends past the 24 h window
    if in_pass and rise_t is not None:
        return {
            "rise_time": _sky_time_to_iso(rise_t),
            "max_alt": round(max_alt_deg, 1),
            "set_time": None,
        }

    return None


def _sky_time_to_iso(t: Any) -> str:
    """Convert a Skyfield Time object to an ISO 8601 UTC string."""
    dt: datetime = t.utc_datetime()
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.get("/satellites")
def get_satellites(lat: float, lon: float) -> dict[str, Any]:
    """
    Return current position and next visible pass for a curated list of
    notable satellites.
    """
    observer = wgs84.latlon(lat, lon)
    t_now = ts.now()

    results: list[dict[str, Any]] = []

    for sat_def in _SATELLITES:
        norad: int = sat_def["norad"]
        label: str = sat_def["label"]

        try:
            satellite = _get_tle(norad, label)
        except HTTPException as exc:
            # Include the satellite with an error marker rather than aborting
            results.append(
                {
                    "name": label,
                    "az": None,
                    "alt": None,
                    "is_visible": False,
                    "next_pass": None,
                    "error": exc.detail,
                }
            )
            continue

        # Current position
        difference = satellite - observer
        topocentric = difference.at(t_now)
        alt, az, distance = topocentric.altaz()

        is_visible = alt.degrees > _VISIBLE_ALT_DEG

        # Next pass
        next_pass = _find_next_pass(satellite, observer, t_now)

        results.append(
            {
                "name": satellite.name or label,
                "az": round(az.degrees, 2),
                "alt": round(alt.degrees, 2),
                "is_visible": is_visible,
                "next_pass": next_pass,
            }
        )

    return {"satellites": results}
