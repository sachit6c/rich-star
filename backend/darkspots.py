"""
Find the darkest sky locations within 50 miles using the Light Pollution Map API.
Samples a grid of candidate points and returns the 5 darkest.
"""
from __future__ import annotations
import math
import asyncio
from typing import Any
import httpx
from fastapi import APIRouter, Query

router = APIRouter()

EARTH_RADIUS_MI = 3958.8
MAX_RADIUS_MI = 50
GRID_STEPS = 7  # 7x7 = 49 candidate points
MAX_CANDIDATES = 30

LP_MAP_URL = (
    "https://www.lightpollutionmap.info/QueryRaster/"
    "?ql=wa_2015&qt=point&qd=&lonlat={lat},{lon}"
)


def _sqm_to_bortle(sqm: float) -> int:
    if sqm > 21.8:
        return 2
    if sqm > 21.4:
        return 3
    if sqm > 20.8:
        return 4
    if sqm > 20.1:
        return 5
    if sqm > 19.1:
        return 6
    return 7


def _bortle_description(bortle: int) -> str:
    descriptions = {
        1: "Pristine dark sky — zodiacal light visible, limiting magnitude ~7.6",
        2: "Truly dark site — airglow visible, Milky Way shows vast complexity",
        3: "Rural sky — light pollution low on horizon, Milky Way shows detail",
        4: "Rural/suburban transition — some light domes on horizon",
        5: "Suburban sky — Milky Way visible but washed out near horizon",
        6: "Bright suburban sky — Milky Way only near zenith",
        7: "Suburban/urban — only hints of Milky Way near zenith",
    }
    return descriptions.get(bortle, "Urban sky")


def _offset_coords(
    lat: float, lon: float, dx_mi: float, dy_mi: float
) -> tuple[float, float]:
    """Offset lat/lon by dx (east-west) and dy (north-south) in miles."""
    new_lat = lat + (dy_mi / EARTH_RADIUS_MI) * (180 / math.pi)
    new_lon = lon + (dx_mi / EARTH_RADIUS_MI) * (180 / math.pi) / math.cos(
        math.radians(lat)
    )
    return new_lat, new_lon


def _distance_mi(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in miles."""
    R = EARTH_RADIUS_MI
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    )
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _generate_candidates(
    lat: float, lon: float
) -> list[tuple[float, float, float]]:
    """
    Return a list of (candidate_lat, candidate_lon, distance_mi) tuples.
    Builds a 7x7 grid spanning -50..+50 miles, filters to the circle,
    and prepends the user's own location.
    """
    step = (2 * MAX_RADIUS_MI) / (GRID_STEPS - 1)  # ~16.67 mi between steps

    candidates: list[tuple[float, float, float]] = []

    for row in range(GRID_STEPS):
        dy = -MAX_RADIUS_MI + row * step
        for col in range(GRID_STEPS):
            dx = -MAX_RADIUS_MI + col * step
            clat, clon = _offset_coords(lat, lon, dx, dy)
            dist = _distance_mi(lat, lon, clat, clon)
            if dist <= MAX_RADIUS_MI:
                candidates.append((clat, clon, dist))

    # Cap at MAX_CANDIDATES (excluding user location which is added separately)
    candidates = candidates[:MAX_CANDIDATES]

    # Prepend user's own location so it is always queried
    user_entry = (lat, lon, 0.0)
    candidates.insert(0, user_entry)

    return candidates


async def _fetch_sqm(
    client: httpx.AsyncClient, lat: float, lon: float
) -> float | None:
    """
    Query the Light Pollution Map API for a single point.
    Returns the SQM value or None on failure.
    """
    url = LP_MAP_URL.format(lat=round(lat, 6), lon=round(lon, 6))
    try:
        response = await client.get(url, timeout=5.0)
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
        if "error" in payload:
            return None
        data = payload.get("data")
        if data is None or not isinstance(data, (int, float)):
            return None
        return float(data)
    except Exception:
        return None


@router.get("/darkspots")
async def get_darkspots(
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
) -> dict:
    """
    Return the 5 darkest sky locations within 50 miles of the user,
    plus the sky quality at the user's own location.
    """
    candidates = _generate_candidates(lat, lon)

    results: list[dict] = []
    any_success = False

    async with httpx.AsyncClient() as client:
        for i, (clat, clon, dist) in enumerate(candidates):
            if i > 0:
                # Be polite to the free API
                await asyncio.sleep(0.1)
            sqm = await _fetch_sqm(client, clat, clon)
            if sqm is not None:
                any_success = True
                results.append(
                    {
                        "lat": round(clat, 6),
                        "lon": round(clon, 6),
                        "distance_mi": round(dist, 1),
                        "sqm": round(sqm, 2),
                        "bortle": _sqm_to_bortle(sqm),
                        "is_user_location": (dist == 0.0),
                    }
                )

    if not any_success:
        return {
            "error": (
                "Unable to reach the Light Pollution Map API. "
                "Please try again later."
            ),
            "spots": [],
        }

    # Separate user location from grid candidates
    user_result = next((r for r in results if r["is_user_location"]), None)
    user_bortle: int | None = user_result["bortle"] if user_result else None
    user_sqm: float | None = user_result["sqm"] if user_result else None

    # Build candidate spots (exclude user location entry)
    spot_candidates = [r for r in results if not r["is_user_location"]]

    # Sort by SQM descending (darkest first), then by distance ascending as tiebreaker
    spot_candidates.sort(key=lambda r: (-r["sqm"], r["distance_mi"]))

    # Take top 5; exclude user's own location unless it's notably dark (Bortle <= 5)
    top_spots = spot_candidates[:5]

    # Format output spots
    spots = [
        {
            "lat": r["lat"],
            "lon": r["lon"],
            "distance_mi": r["distance_mi"],
            "bortle": r["bortle"],
            "sqm": r["sqm"],
            "description": _bortle_description(r["bortle"]),
            "maps_url": f"https://maps.google.com/maps?q={r['lat']},{r['lon']}",
        }
        for r in top_spots
    ]

    response: dict = {"spots": spots}
    if user_bortle is not None:
        response["user_bortle"] = user_bortle
    if user_sqm is not None:
        response["user_sqm"] = user_sqm

    return response
