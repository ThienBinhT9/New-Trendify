"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field


# ==================== Post Recommendation ====================

class PostRecommendation(BaseModel):
    post_ids: list[str] = Field(default_factory=list, alias="postIds")
    scores: list[float] = Field(default_factory=list)
    next_cursor: str | None = Field(None, alias="nextCursor")
    meta: dict = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


# ==================== Health ====================

class HealthResponse(BaseModel):
    status: str = "ok"
    mongodb: str = "disconnected"
    redis: str = "disconnected"
