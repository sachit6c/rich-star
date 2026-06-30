"""
Stargazing API — FastAPI application entry point.

Run with:
    uvicorn backend.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS
import backend.sky as sky
import backend.constellation as constellation
import backend.satellites as satellites
import backend.forecast as forecast
import backend.darkspots as darkspots

app = FastAPI(
    title="Stargazing API",
    description="Real-time star, planet, moon, satellite, and constellation data.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(sky.router)
app.include_router(constellation.router)
app.include_router(satellites.router)
app.include_router(forecast.router)
app.include_router(darkspots.router)

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness probe."""
    return {"status": "ok"}
