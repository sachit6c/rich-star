"""
7-night stargazing forecast: twilight windows, moon, planet visibility, ISS passes.
Re-uses the Skyfield objects initialized in sky.py to avoid double-loading ephemeris.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Query
from skyfield import almanac
from skyfield.api import wgs84

# Import shared Skyfield state from sky.py (already loaded — no double ephemeris load)
from backend.sky import ts, eph, _PLANETS, _moon_body, _sun_body, _earth

router = APIRouter()
utc = timezone.utc

# ---------------------------------------------------------------------------
# Meteor shower calendar
# (name, month, day_start, day_end, peak_day, peak_rate)
# ---------------------------------------------------------------------------

METEOR_SHOWERS: list[tuple[str, int, int, int, int, int]] = [
    ("Quadrantids",     1,  1,  5,  3, 120),
    ("Lyrids",          4, 16, 25, 22,  18),
    ("Eta Aquariids",   5,  1, 10,  6,  50),
    ("Delta Aquariids", 7, 12, 23, 28,  20),
    ("Perseids",        8,  9, 14, 12, 100),
    ("Orionids",       10, 16, 27, 21,  20),
    ("Leonids",        11,  6, 30, 17,  15),
    ("Geminids",       12,  7, 17, 14, 120),
    ("Ursids",         12, 17, 26, 22,  10),
]


def _meteor_shower_for_date(dt: datetime) -> dict[str, Any] | None:
    m, d = dt.month, dt.day
    for name, ms, ds, de, pd, rate in METEOR_SHOWERS:
        if m == ms and ds <= d <= de:
            peak = d == pd
            return {"name": name, "peak": peak, "rate": rate if peak else rate // 3}
    return None


# ---------------------------------------------------------------------------
# Moon phase helpers
# ---------------------------------------------------------------------------

def _moon_phase_name(illumination: float, is_waxing: bool) -> str:
    if illumination < 0.03:
        return "New Moon"
    if illumination < 0.35:
        return "Waxing Crescent" if is_waxing else "Waning Crescent"
    if illumination < 0.60:
        return "First Quarter" if is_waxing else "Last Quarter"
    if illumination < 0.90:
        return "Waxing Gibbous" if is_waxing else "Waning Gibbous"
    return "Full Moon"


def _moon_illumination_at(t: Any) -> float:
    """Return fractional illumination of the moon (0–1) at Skyfield time t."""
    sun_pos = _earth.at(t).observe(_sun_body).apparent()
    moon_pos = _earth.at(t).observe(_moon_body).apparent()

    sun_ra, sun_dec, _ = sun_pos.radec()
    moon_ra, moon_dec, _ = moon_pos.radec()

    # Great-circle angular separation as phase angle (degrees)
    dra_deg = (moon_ra.hours - sun_ra.hours) * 15.0
    ddec_deg = moon_dec.degrees - sun_dec.degrees
    phase_angle_deg = math.degrees(
        math.acos(
            max(-1.0, min(1.0,
                math.cos(math.radians(ddec_deg)) *
                math.cos(math.radians(dra_deg))
            ))
        )
    )
    return (1.0 - math.cos(math.radians(phase_angle_deg))) / 2.0


# ---------------------------------------------------------------------------
# Time conversion helper
# ---------------------------------------------------------------------------

def _sky_to_iso(t: Any) -> str:
    """Convert a Skyfield Time to a UTC ISO 8601 string."""
    dt: datetime = t.utc_datetime()
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# ISS pass helper (delegates to satellites module logic)
# ---------------------------------------------------------------------------

def _get_iss_passes(
    observer: Any,
    t_start: Any,
    t_end: Any,
) -> list[dict[str, Any]]:
    """
    Find ISS passes (altitude > 10°) within the window [t_start, t_end].
    Returns a list of {rise_time, max_alt, set_time} dicts.
    Gracefully returns [] if the satellites module or TLE fetch fails.
    """
    try:
        from backend.satellites import _get_tle, _VISIBLE_ALT_DEG

        iss_norad = 25544
        satellite = _get_tle(iss_norad, "ISS (ZARYA)")
    except Exception:
        return []

    passes: list[dict[str, Any]] = []
    step_seconds = 30
    step_days = step_seconds / 86400.0

    start_tt = t_start.tt
    end_tt = t_end.tt
    total_steps = int((end_tt - start_tt) * 86400.0 / step_seconds) + 1

    in_pass = False
    rise_t: Any = None
    max_alt_deg = 0.0

    for i in range(total_steps):
        t_i = ts.tt_jd(start_tt + i * step_days)
        if t_i.tt > end_tt:
            break

        try:
            difference = satellite - observer
            topocentric = difference.at(t_i)
            alt, _az, _ = topocentric.altaz()
        except Exception:
            continue

        above = alt.degrees > _VISIBLE_ALT_DEG

        if above and not in_pass:
            in_pass = True
            rise_t = t_i
            max_alt_deg = alt.degrees

        elif above and in_pass:
            if alt.degrees > max_alt_deg:
                max_alt_deg = alt.degrees

        elif not above and in_pass:
            set_t = t_i
            passes.append({
                "rise_time": _sky_to_iso(rise_t),
                "max_alt": round(max_alt_deg, 1),
                "set_time": _sky_to_iso(set_t),
            })
            in_pass = False
            rise_t = None
            max_alt_deg = 0.0

    # Pass that extends to edge of window
    if in_pass and rise_t is not None:
        passes.append({
            "rise_time": _sky_to_iso(rise_t),
            "max_alt": round(max_alt_deg, 1),
            "set_time": None,
        })

    return passes


# ---------------------------------------------------------------------------
# Per-night computation
# ---------------------------------------------------------------------------

def _compute_night(
    date: datetime,
    lat: float,
    lon: float,
) -> dict[str, Any]:
    """
    Compute stargazing forecast for one night starting at the given date
    (local calendar date; we look at astronomical night covering that
    evening through the following dawn).
    """
    observer = wgs84.latlon(lat, lon)

    # Search window: noon on `date` to noon the following day (UTC).
    # Using noon-to-noon avoids straddling sunrise/set in a way that
    # confuses almanac — we find the night embedded within.
    noon_utc = date.replace(hour=12, minute=0, second=0, microsecond=0, tzinfo=utc)
    next_noon_utc = noon_utc + timedelta(days=1)

    t0 = ts.from_datetime(noon_utc)
    t1 = ts.from_datetime(next_noon_utc)

    # ------------------------------------------------------------------
    # Twilight / dark-sky window
    # ------------------------------------------------------------------
    # dark_twilight_day returns:
    #   0 = astronomical night (fully dark)
    #   1 = astronomical twilight
    #   2 = nautical twilight
    #   3 = civil twilight
    #   4 = day
    f_twilight = almanac.dark_twilight_day(eph, observer)

    try:
        times_tw, events_tw = almanac.find_discrete(t0, t1, f_twilight)
    except Exception:
        times_tw, events_tw = [], []

    twilight_start: str | None = None   # when darkness begins (evening)
    twilight_end: str | None = None     # when darkness ends (morning)
    dark_hours = 0.0

    # Walk transitions and find the 4→0 (or 1→0) crossing in the evening
    # and the 0→1 (or 0→4) crossing in the morning.
    # Strategy: collect all times when state == 0 (astronomical night).
    dark_start_t: Any = None
    dark_end_t: Any = None

    # Check initial state at t0
    try:
        initial_state = int(f_twilight(t0))
    except Exception:
        initial_state = 4  # assume day if we can't determine

    prev_state = initial_state

    for t_ev, ev in zip(times_tw, events_tw):
        ev_int = int(ev)
        # Transition INTO astronomical darkness (state 0)
        if ev_int == 0 and prev_state != 0 and dark_start_t is None:
            dark_start_t = t_ev
        # Transition OUT OF astronomical darkness
        elif ev_int != 0 and prev_state == 0 and dark_start_t is not None and dark_end_t is None:
            dark_end_t = t_ev
        prev_state = ev_int

    # Handle case where darkness started before t0 (polar summer anomaly handled below)
    if dark_start_t is not None:
        twilight_start = _sky_to_iso(dark_start_t)
    if dark_end_t is not None:
        twilight_end = _sky_to_iso(dark_end_t)

    if dark_start_t is not None and dark_end_t is not None:
        dark_hours = round((dark_end_t.tt - dark_start_t.tt) * 24.0, 2)
    else:
        dark_hours = 0.0

    # ------------------------------------------------------------------
    # Moon
    # ------------------------------------------------------------------
    # Midpoint of the search window for phase calculation
    mid_utc = noon_utc + timedelta(hours=18)  # ~midnight local
    t_mid = ts.from_datetime(mid_utc)
    t_mid_minus1d = ts.from_datetime(mid_utc - timedelta(hours=24))

    illum_now = _moon_illumination_at(t_mid)
    illum_yesterday = _moon_illumination_at(t_mid_minus1d)
    is_waxing = illum_now >= illum_yesterday

    moon_illumination = round(illum_now, 3)
    moon_phase = _moon_phase_name(illum_now, is_waxing)

    # Moon rise / set
    f_moon = almanac.risings_and_settings(eph, _moon_body, observer)
    try:
        times_moon, events_moon = almanac.find_discrete(t0, t1, f_moon)
    except Exception:
        times_moon, events_moon = [], []

    moon_rise: str | None = None
    moon_set: str | None = None

    for t_ev, ev in zip(times_moon, events_moon):
        iso = _sky_to_iso(t_ev)
        if int(ev) == 1 and moon_rise is None:   # 1 = rising
            moon_rise = iso
        elif int(ev) == 0 and moon_set is None:  # 0 = setting
            moon_set = iso

    # ------------------------------------------------------------------
    # Planet visibility
    # ------------------------------------------------------------------
    # Only check planets during the astronomical darkness window,
    # falling back to the full noon-to-noon span if no dark window found.
    if dark_start_t is not None and dark_end_t is not None:
        planet_window_start = dark_start_t.tt
        planet_window_end = dark_end_t.tt
    else:
        planet_window_start = t0.tt
        planet_window_end = t1.tt

    earth_observer = _earth + observer
    visible_planets: list[dict[str, Any]] = []

    step_30min_days = 30.0 / (24.0 * 60.0)
    n_planet_steps = max(1, int((planet_window_end - planet_window_start) / step_30min_days))

    for planet_name, planet_body in _PLANETS.items():
        display_name = planet_name.replace(" barycenter", "")

        alts: list[tuple[float, Any]] = []  # (alt_degrees, t)
        for i in range(n_planet_steps + 1):
            t_i = ts.tt_jd(planet_window_start + i * step_30min_days)
            if t_i.tt > planet_window_end:
                break
            try:
                astrometric = earth_observer.at(t_i).observe(planet_body)
                apparent = astrometric.apparent()
                alt, _az, _ = apparent.altaz()
                alts.append((alt.degrees, t_i))
            except Exception:
                continue

        if not alts:
            continue

        max_alt_deg = max(a for a, _ in alts)
        if max_alt_deg <= 10.0:
            continue

        # Approximate rise: first sample crossing above 0°
        # Approximate set: last sample above 0°
        planet_rise_t: Any = None
        planet_set_t: Any = None

        for alt_deg, t_i in alts:
            if alt_deg > 0.0:
                if planet_rise_t is None:
                    planet_rise_t = t_i
                planet_set_t = t_i

        visible_planets.append({
            "name": display_name,
            "max_alt": round(max_alt_deg, 1),
            "rise": _sky_to_iso(planet_rise_t) if planet_rise_t else None,
            "set": _sky_to_iso(planet_set_t) if planet_set_t else None,
        })

    # ------------------------------------------------------------------
    # ISS passes
    # ------------------------------------------------------------------
    if dark_start_t is not None and dark_end_t is not None:
        iss_t0 = dark_start_t
        iss_t1 = dark_end_t
    else:
        iss_t0 = t0
        iss_t1 = t1

    iss_passes = _get_iss_passes(observer, iss_t0, iss_t1)

    # ------------------------------------------------------------------
    # Meteor showers
    # ------------------------------------------------------------------
    meteor_shower = _meteor_shower_for_date(date)

    return {
        "date": date.strftime("%Y-%m-%d"),
        "twilight_start": twilight_start,
        "twilight_end": twilight_end,
        "dark_hours": dark_hours,
        "moon_phase": moon_phase,
        "moon_illumination": moon_illumination,
        "moon_rise": moon_rise,
        "moon_set": moon_set,
        "visible_planets": visible_planets,
        "iss_passes": iss_passes,
        "meteor_shower": meteor_shower,
    }


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/forecast")
def get_forecast(
    lat: float = Query(..., ge=-90, le=90, description="Observer latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Observer longitude"),
) -> dict[str, Any]:
    """
    Return a 7-night stargazing forecast for the given location.

    Each night includes:
    - Astronomical twilight window and dark hours
    - Moon phase, illumination, rise/set
    - Visible planets (max altitude > 10°) with rise/set
    - ISS passes during astronomical darkness
    - Active meteor showers
    """
    today_utc = datetime.now(utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    nights: list[dict[str, Any]] = []
    for day_offset in range(7):
        night_date = today_utc + timedelta(days=day_offset)
        try:
            night_data = _compute_night(night_date, lat, lon)
        except Exception as exc:
            # Never let a single night crash the whole forecast
            night_data = {
                "date": night_date.strftime("%Y-%m-%d"),
                "twilight_start": None,
                "twilight_end": None,
                "dark_hours": 0.0,
                "moon_phase": "Unknown",
                "moon_illumination": 0.0,
                "moon_rise": None,
                "moon_set": None,
                "visible_planets": [],
                "iss_passes": [],
                "meteor_shower": None,
                "error": str(exc),
            }
        nights.append(night_data)

    return {"nights": nights}
