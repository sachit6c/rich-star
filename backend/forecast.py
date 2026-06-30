from fastapi import APIRouter

router = APIRouter()


@router.get("/forecast")
def get_forecast(lat: float, lon: float) -> dict:
    """Stub endpoint — weather/seeing forecast (not yet implemented)."""
    return {"nights": []}
