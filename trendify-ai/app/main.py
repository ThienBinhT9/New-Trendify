"""
Trendify AI Recommendation Service — FastAPI Entry Point.

Module:
  Post Recommendations — Content-Based Filtering (TF-IDF + Cosine Similarity)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.mongo_service import MongoService
from app.services.redis_service import RedisService
from app.models.schemas import HealthResponse
from app.routers import post_recommendations


# ==================== LIFESPAN (startup/shutdown) ====================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage service lifecycle: connect on startup, disconnect on shutdown."""
    # ---- STARTUP ----
    mongo = MongoService.get_instance()
    redis = RedisService.get_instance()

    await mongo.connect()
    await redis.connect()

    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🤖 Trendify AI Service is ready!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    yield

    # ---- SHUTDOWN ----
    await redis.disconnect()
    await mongo.disconnect()
    print("👋 AI Service shut down gracefully")


# ==================== APP FACTORY ====================

settings = get_settings()

app = FastAPI(
    title="Trendify AI Recommendation Service",
    description=(
        "AI-powered recommendation engine providing:\n"
        "- **Post Feed**: Smart ForYou feed (Content-Based Filtering)"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ROUTES ====================

app.include_router(
    post_recommendations.router,
    prefix="/api/recommendations",
)


# ==================== HEALTH CHECK ====================


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check service health and connection status."""
    mongo_status = "connected"
    redis_status = "connected"

    try:
        mongo = MongoService.get_instance()
        await mongo.db.command("ping")
    except Exception:
        mongo_status = "disconnected"

    try:
        redis = RedisService.get_instance()
        await redis._client.ping()
    except Exception:
        redis_status = "disconnected"

    return HealthResponse(
        status="ok" if mongo_status == "connected" else "degraded",
        mongodb=mongo_status,
        redis=redis_status,
    )
