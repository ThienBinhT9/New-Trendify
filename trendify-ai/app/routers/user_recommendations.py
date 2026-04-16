"""
PYMK (People You May Know) API endpoints.
"""

from fastapi import APIRouter, Query
from app.engines.pymk.engine import PYMKEngine
from app.models.schemas import PYMKResponse, DismissRequest, DismissResponse

router = APIRouter(prefix="/users", tags=["User Recommendations"])

pymk_engine = PYMKEngine()


@router.get("/{user_id}", response_model=PYMKResponse)
async def get_user_suggestions(
    user_id: str,
    limit: int = Query(20, ge=1, le=50),
):
    """
    Get personalized friend suggestions for a user.

    Uses Graph-based Collaborative Filtering:
    - Friends of Friends (FoF) analysis
    - Jaccard Coefficient & Adamic-Adar Index
    - Interaction affinity (co-likes/comments)
    - Content similarity (shared hashtags)
    """
    result = await pymk_engine.recommend(user_id, limit=limit)
    return result


@router.post("/dismiss", response_model=DismissResponse)
async def dismiss_user_suggestion(body: DismissRequest):
    """Dismiss a user suggestion so it won't appear again."""
    await pymk_engine.dismiss(body.user_id, body.target_id)
    return DismissResponse()
