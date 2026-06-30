from fastapi import APIRouter

router = APIRouter()


@router.get("/darkspots")
def get_darkspots(lat: float, lon: float) -> dict:
    """Stub endpoint — nearby dark-sky spots (not yet implemented)."""
    return {"spots": []}
