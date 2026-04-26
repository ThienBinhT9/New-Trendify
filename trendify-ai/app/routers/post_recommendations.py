"""
Post Recommendation API endpoints.
"""

from fastapi import APIRouter, Query
from app.engines.post.engine import PostRecommendationEngine
from app.models.schemas import PostRecommendation

router = APIRouter(prefix="/posts", tags=["Post Recommendations"])

post_engine = PostRecommendationEngine()


@router.get("/{user_id}", response_model=PostRecommendation)
async def get_post_recommendations(
    user_id: str,
    limit: int = Query(20, ge=1, le=50),
    page: int = Query(0, ge=0),
):
    """
    Get personalized post recommendations for a user's ForYou feed.

    Uses Content-Based Filtering:
    - TF-IDF Vectorization of post content + hashtags
    - Cosine Similarity between user taste profile and candidate posts
    - Popularity + Freshness scoring (engagement × time decay)

    Adaptive weights handle cold-start users automatically.
    """
    result = await post_engine.recommend(
        user_id, limit=limit, page=page
    )
    return result
