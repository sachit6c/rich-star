"""
FastAPI router for /sky — computes stars, planets, moon, and sun positions
using Skyfield. The de421.bsp ephemeris is downloaded on first use into
backend/data/.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from skyfield.api import Angle, Star, load, wgs84
from skyfield.framelib import ecliptic_frame  # noqa: F401 (available but unused)

# ---------------------------------------------------------------------------
# Ephemeris setup
# ---------------------------------------------------------------------------

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

_EPH_PATH = os.path.join(DATA_DIR, "de421.bsp")

# Skyfield's Loader uses its own data directory for downloads; we point it at
# our backend/data/ folder so the file lands there.
_loader = load.open.__self__ if hasattr(load.open, "__self__") else load  # type: ignore[attr-defined]

# Re-create a Loader rooted at DATA_DIR so downloads go there.
from skyfield.api import Loader  # noqa: E402

_local_load = Loader(DATA_DIR)
ts = _local_load.timescale()

if not os.path.exists(_EPH_PATH):
    eph = _local_load("de421.bsp")
else:
    eph = _local_load("de421.bsp")

_earth = eph["earth"]
_sun_body = eph["sun"]
_moon_body = eph["moon"]

_PLANETS: dict[str, Any] = {
    "Mercury": eph["mercury"],
    "Venus": eph["venus"],
    "Mars": eph["mars"],
    "Jupiter": eph["jupiter barycenter"],
    "Saturn": eph["saturn barycenter"],
    "Uranus": eph["uranus barycenter"],
    "Neptune": eph["neptune barycenter"],
}

# ---------------------------------------------------------------------------
# Hardcoded bright-star catalog (top 50 by visual magnitude)
# Columns: HIP, name, RA (degrees), Dec (degrees), magnitude, constellation
# RA/Dec values are J2000 approximations.
# ---------------------------------------------------------------------------

BRIGHT_STARS: list[dict[str, Any]] = [
    {"hip": 32349, "name": "Sirius",        "ra": 101.287,  "dec": -16.716, "mag": -1.46, "con": "CMA"},
    {"hip": 30438, "name": "Canopus",       "ra": 95.988,   "dec": -52.696, "mag": -0.72, "con": "CAR"},
    {"hip": 69673, "name": "Arcturus",      "ra": 213.915,  "dec":  19.182, "mag": -0.05, "con": "BOO"},
    {"hip": 91262, "name": "Vega",          "ra": 279.235,  "dec":  38.784, "mag":  0.03, "con": "LYR"},
    {"hip": 24608, "name": "Capella",       "ra":  79.172,  "dec":  45.998, "mag":  0.08, "con": "AUR"},
    {"hip": 24436, "name": "Rigel",         "ra":  78.634,  "dec":  -8.202, "mag":  0.12, "con": "ORI"},
    {"hip": 37279, "name": "Procyon",       "ra": 114.825,  "dec":   5.225, "mag":  0.34, "con": "CMI"},
    {"hip": 27989, "name": "Betelgeuse",    "ra":  88.793,  "dec":   7.407, "mag":  0.42, "con": "ORI"},
    {"hip":  7588, "name": "Achernar",      "ra":  24.429,  "dec": -57.237, "mag":  0.46, "con": "ERI"},
    {"hip": 68702, "name": "Hadar",         "ra": 210.956,  "dec": -60.373, "mag":  0.61, "con": "CEN"},
    {"hip": 97649, "name": "Altair",        "ra": 297.696,  "dec":   8.868, "mag":  0.75, "con": "AQL"},
    {"hip": 60718, "name": "Acrux",         "ra": 186.650,  "dec": -63.099, "mag":  0.77, "con": "CRU"},
    {"hip": 21421, "name": "Aldebaran",     "ra":  68.980,  "dec":  16.509, "mag":  0.85, "con": "TAU"},
    {"hip": 80763, "name": "Antares",       "ra": 247.352,  "dec": -26.432, "mag":  0.96, "con": "SCO"},
    {"hip": 65474, "name": "Spica",         "ra": 201.298,  "dec": -11.161, "mag":  0.98, "con": "VIR"},
    {"hip": 37826, "name": "Pollux",        "ra": 116.329,  "dec":  28.026, "mag":  1.14, "con": "GEM"},
    {"hip":113368, "name": "Fomalhaut",     "ra": 344.413,  "dec": -29.622, "mag":  1.16, "con": "PSA"},
    {"hip":102098, "name": "Deneb",         "ra": 310.358,  "dec":  45.280, "mag":  1.25, "con": "CYG"},
    {"hip": 62434, "name": "Mimosa",        "ra": 191.930,  "dec": -59.689, "mag":  1.25, "con": "CRU"},
    {"hip": 49669, "name": "Regulus",       "ra": 152.093,  "dec":  11.967, "mag":  1.35, "con": "LEO"},
    {"hip": 33579, "name": "Adhara",        "ra": 104.656,  "dec": -28.972, "mag":  1.50, "con": "CMA"},
    {"hip": 36850, "name": "Castor",        "ra": 113.650,  "dec":  31.889, "mag":  1.58, "con": "GEM"},
    {"hip": 85927, "name": "Shaula",        "ra": 263.402,  "dec": -37.104, "mag":  1.63, "con": "SCO"},
    {"hip": 25336, "name": "Bellatrix",     "ra":  81.283,  "dec":   6.350, "mag":  1.64, "con": "ORI"},
    {"hip": 25428, "name": "Elnath",        "ra":  81.573,  "dec":  28.608, "mag":  1.65, "con": "TAU"},
    {"hip": 45238, "name": "Miaplacidus",   "ra": 138.300,  "dec": -69.717, "mag":  1.67, "con": "CAR"},
    {"hip": 26311, "name": "Alnilam",       "ra":  84.053,  "dec":  -1.202, "mag":  1.69, "con": "ORI"},
    {"hip": 62956, "name": "Alioth",        "ra": 193.507,  "dec":  55.960, "mag":  1.76, "con": "UMA"},
    {"hip": 54061, "name": "Dubhe",         "ra": 165.932,  "dec":  61.751, "mag":  1.79, "con": "UMA"},
    {"hip": 15863, "name": "Mirfak",        "ra":  51.081,  "dec":  49.861, "mag":  1.79, "con": "PER"},
    {"hip": 34444, "name": "Wezen",         "ra": 107.098,  "dec": -26.393, "mag":  1.84, "con": "CMA"},
    {"hip": 39953, "name": "Regor",         "ra": 122.383,  "dec": -47.337, "mag":  1.83, "con": "VEL"},
    {"hip": 90185, "name": "Kaus Australis","ra": 276.043,  "dec": -34.385, "mag":  1.85, "con": "SGR"},
    {"hip": 41037, "name": "Avior",         "ra": 125.628,  "dec": -59.510, "mag":  1.86, "con": "CAR"},
    {"hip": 67301, "name": "Alkaid",        "ra": 206.885,  "dec":  49.313, "mag":  1.86, "con": "UMA"},
    {"hip": 86228, "name": "Sargas",        "ra": 264.330,  "dec": -42.998, "mag":  1.87, "con": "SCO"},
    {"hip":109268, "name": "Alnair",        "ra": 332.058,  "dec": -46.961, "mag":  1.74, "con": "GRU"},
    {"hip": 82273, "name": "Atria",         "ra": 252.166,  "dec": -69.028, "mag":  1.91, "con": "TRA"},
    {"hip":100751, "name": "Peacock",       "ra": 306.412,  "dec": -56.735, "mag":  1.94, "con": "PAV"},
    {"hip": 42913, "name": "Alsephina",     "ra": 131.176,  "dec": -54.709, "mag":  1.96, "con": "VEL"},
    {"hip": 11767, "name": "Polaris",       "ra":  37.955,  "dec":  89.264, "mag":  1.98, "con": "UMI"},
    {"hip":  9884, "name": "Hamal",         "ra":  31.793,  "dec":  23.463, "mag":  2.00, "con": "ARI"},
    {"hip": 46390, "name": "Alphard",       "ra": 141.897,  "dec":  -8.658, "mag":  1.98, "con": "HYA"},
    {"hip": 92855, "name": "Nunki",         "ra": 283.816,  "dec": -26.297, "mag":  2.05, "con": "SGR"},
    {"hip": 68933, "name": "Menkent",       "ra": 211.671,  "dec": -36.370, "mag":  2.06, "con": "CEN"},
    {"hip": 87833, "name": "Eltanin",       "ra": 269.152,  "dec":  51.489, "mag":  2.23, "con": "DRA"},
    {"hip":  5447, "name": "Mirach",        "ra":  17.433,  "dec":  35.620, "mag":  2.06, "con": "AND"},
    {"hip":  3419, "name": "Diphda",        "ra":  10.897,  "dec": -17.987, "mag":  2.04, "con": "CET"},
    {"hip": 57632, "name": "Denebola",      "ra": 177.265,  "dec":  14.572, "mag":  2.14, "con": "LEO"},
    {"hip":   677, "name": "Alpheratz",     "ra":   2.097,  "dec":  29.090, "mag":  2.06, "con": "AND"},
]

# ---------------------------------------------------------------------------
# Constellation line segments (HIP pairs)
# ---------------------------------------------------------------------------

CONSTELLATION_LINES: dict[str, list[list[int]]] = {
    # Orion
    "ORI": [
        [27989, 26311],   # Betelgeuse → Alnilam
        [26311, 26727],   # Alnilam → Alnitak
        [26727, 25930],   # Alnitak → Mintaka (belt)
        [25930, 26311],   # Mintaka → Alnilam (belt closes)
        [25336, 26727],   # Bellatrix → Alnitak
        [27989, 25336],   # Betelgeuse → Bellatrix (shoulders)
        [24436, 27366],   # Rigel → Saiph (feet)
        [24436, 25336],   # Rigel → Bellatrix
        [27366, 27989],   # Saiph → Betelgeuse
        [26311, 26727],   # belt middle segment (explicit)
    ],
    # Ursa Major (Big Dipper)
    "UMA": [
        [54061, 58001],   # Dubhe → Merak
        [58001, 59774],   # Merak → Phecda
        [59774, 62956],   # Phecda → Alioth
        [62956, 65378],   # Alioth → Mizar
        [65378, 67301],   # Mizar → Alkaid
        [54061, 53910],   # Dubhe → Muscida (head)
        [59774, 57399],   # Phecda → Megrez
        [57399, 54061],   # Megrez → Dubhe
        [57399, 58001],   # Megrez → Merak
    ],
    # Cassiopeia (W shape)
    "CAS": [
        [746,   3179],    # Caph → Schedar
        [3179,  4427],    # Schedar → Gamma Cas
        [4427,  6686],    # Gamma Cas → Ruchbah
        [6686,  8886],    # Ruchbah → Segin
    ],
    # Scorpius
    "SCO": [
        [80763, 78820],   # Antares → Sigma Sco
        [78820, 79374],   # → Tau Sco
        [79374, 80112],   # → Pi Sco
        [80112, 80763],   # → Antares
        [80763, 81266],   # Antares → Mu Sco (tail begins)
        [81266, 82514],   # → Zeta Sco
        [82514, 84143],   # → Eta Sco
        [84143, 85696],   # → Theta Sco
        [85696, 85927],   # → Shaula (tail tip)
        [85927, 86228],   # Shaula → Sargas
    ],
    # Leo
    "LEO": [
        [49669, 50583],   # Regulus → Eta Leo
        [50583, 49583],   # → Gamma Leo (Algieba)
        [49583, 47908],   # Algieba → Zosma
        [47908, 57632],   # Zosma → Denebola
        [49583, 46750],   # Algieba → Adhafera
        [46750, 44816],   # Adhafera → Epsilon Leo (Ras Elased)
        [44816, 43813],   # → Mu Leo
    ],
    # Gemini
    "GEM": [
        [36850, 34693],   # Castor → Mebsuda
        [37826, 35350],   # Pollux → Propus
        [36850, 37826],   # Castor → Pollux (heads)
        [35350, 34693],   # Propus → Mebsuda
        [34693, 32246],   # Mebsuda → Alhena
        [32246, 30343],   # Alhena → Tejat
        [30343, 29655],   # Tejat → Mu Gem
    ],
    # Cygnus (Northern Cross)
    "CYG": [
        [102098, 100453],  # Deneb → Sadr
        [100453, 95947],   # Sadr → Zeta Cyg (south)
        [95947,  94779],   # → Epsilon Cyg
        [100453, 98110],   # Sadr → Delta Cyg (north)
        [98110,  102488],  # → Eta Cyg
        [100453, 99675],   # Sadr → Iota Cyg (east arm)
        [100453, 101769],  # Sadr → Kappa Cyg (west arm)
    ],
}

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter()

utc = timezone.utc


def _planet_magnitude(name: str, sun_dist: float, earth_dist: float, phase_angle_deg: float) -> float:
    """Very rough apparent-magnitude estimates for planets."""
    # Simple distance-scaled approximations (good enough for display)
    base: dict[str, float] = {
        "Mercury": -0.0,
        "Venus":   -4.4,
        "Mars":    -1.5,
        "Jupiter": -2.9,
        "Saturn":   0.7,
        "Uranus":   5.5,
        "Neptune":  8.0,
    }
    key = name.split()[0]  # strip " barycenter"
    return base.get(key, 5.0)


@router.get("/sky")
def get_sky(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    dt: str | None = Query(None, description="ISO 8601 datetime; defaults to now"),
) -> dict[str, Any]:
    """
    Return positions of stars, planets, moon, and sun for the given
    observer location and time.
    """
    # --- parse time ---
    if dt is None:
        t_sky = ts.now()
        obs_dt = datetime.now(utc)
    else:
        try:
            obs_dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            if obs_dt.tzinfo is None:
                obs_dt = obs_dt.replace(tzinfo=utc)
            t_sky = ts.from_datetime(obs_dt)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid datetime: {exc}") from exc

    observer = wgs84.latlon(lat, lon)
    earth_observer = _earth + observer

    # --- stars ---
    stars_out: list[dict[str, Any]] = []
    for s in BRIGHT_STARS:
        star = Star(ra_hours=s["ra"] / 15.0, dec_degrees=s["dec"])
        astrometric = earth_observer.at(t_sky).observe(star)
        apparent = astrometric.apparent()
        alt, az, _ = apparent.altaz()
        if alt.degrees > -5.0 and s["mag"] < 6.5:
            stars_out.append(
                {
                    "hip": s["hip"],
                    "name": s["name"],
                    "magnitude": s["mag"],
                    "az": round(az.degrees, 2),
                    "alt": round(alt.degrees, 2),
                    "constellation": s["con"],
                }
            )

    # --- planets ---
    planets_out: list[dict[str, Any]] = []
    for planet_name, planet_body in _PLANETS.items():
        astrometric = earth_observer.at(t_sky).observe(planet_body)
        apparent = astrometric.apparent()
        alt, az, distance = apparent.altaz()
        display_name = planet_name.replace(" barycenter", "")
        mag = _planet_magnitude(planet_name, 0, distance.au, 0)
        planets_out.append(
            {
                "name": display_name,
                "az": round(az.degrees, 2),
                "alt": round(alt.degrees, 2),
                "magnitude": mag,
            }
        )

    # --- moon ---
    moon_astrometric = earth_observer.at(t_sky).observe(_moon_body)
    moon_apparent = moon_astrometric.apparent()
    moon_alt, moon_az, _ = moon_apparent.altaz()

    # Illumination fraction via phase angle
    sun_pos = _earth.at(t_sky).observe(_sun_body).apparent()
    moon_pos = _earth.at(t_sky).observe(_moon_body).apparent()
    # phase angle in degrees
    from skyfield.trigonometry import position_angle_of  # noqa: F401
    # Simplified illumination: use elongation from sun
    sun_ra, sun_dec, _ = sun_pos.radec()
    moon_ra, moon_dec, _ = moon_pos.radec()
    import math
    # Great-circle angular separation (phase angle approximation)
    dra = (moon_ra.hours - sun_ra.hours) * 15.0  # degrees
    ddec = moon_dec.degrees - sun_dec.degrees
    phase_angle = math.sqrt(dra**2 + ddec**2) % 360
    illumination = (1 - math.cos(math.radians(phase_angle))) / 2
    moon_phase = (phase_angle % 360) / 360.0

    moon_out = {
        "az": round(moon_az.degrees, 2),
        "alt": round(moon_alt.degrees, 2),
        "phase": round(moon_phase, 3),
        "illumination": round(illumination, 3),
    }

    # --- sun ---
    sun_astrometric = earth_observer.at(t_sky).observe(_sun_body)
    sun_apparent = sun_astrometric.apparent()
    sun_alt, sun_az, _ = sun_apparent.altaz()
    sun_out = {
        "az": round(sun_az.degrees, 2),
        "alt": round(sun_alt.degrees, 2),
        "is_up": sun_alt.degrees > -0.833,  # standard refraction threshold
    }

    return {
        "stars": stars_out,
        "planets": planets_out,
        "moon": moon_out,
        "sun": sun_out,
        "constellation_lines": CONSTELLATION_LINES,
    }
