"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field


# ==================== PYMK (People You May Know) ====================

class UserSuggestion(BaseModel):
    user_id: str = Field(..., alias="userId")
    score: float
    mutual_count: int = Field(0, alias="mutualCount")
    mutual_users: list[str] = Field(default_factory=list, alias="mutualUsers")
    source: str = "friends_of_friends"
    explanation: str = ""

    model_config = {"populate_by_name": True}


class PYMKResponse(BaseModel):
    suggestions: list[UserSuggestion]
    meta: dict = Field(default_factory=dict)


# ==================== Post Recommendation ====================

class PostRecommendation(BaseModel):
    post_ids: list[str] = Field(default_factory=list, alias="postIds")
    scores: list[float] = Field(default_factory=list)
    next_cursor: str | None = Field(None, alias="nextCursor")
    meta: dict = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


# ==================== Dismiss ====================

class DismissRequest(BaseModel):
    user_id: str = Field(..., alias="userId")
    target_id: str = Field(..., alias="targetId")
    type: str = "user"  # "user" or "post"

    model_config = {"populate_by_name": True}


class DismissResponse(BaseModel):
    success: bool = True
    message: str = "Dismissed successfully"


# ==================== Health ====================

class HealthResponse(BaseModel):
    status: str = "ok"
    mongodb: str = "disconnected"
    redis: str = "disconnected"
    graph_nodes: int = 0
    graph_edges: int = 0
