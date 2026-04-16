"""
Trendify AI Recommendation Service — FastAPI Entry Point.

Two modules:
  1. PYMK (People You May Know) — Graph-based Collaborative Filtering
  2. Post Recommendations — Hybrid CF + Content-Based Filtering
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.mongo_service import MongoService
from app.services.redis_service import RedisService
from app.services.graph_service import GraphService
from app.models.schemas import HealthResponse
from app.routers import user_recommendations, post_recommendations


# ==================== LIFESPAN (startup/shutdown) ====================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage service lifecycle: connect on startup, disconnect on shutdown."""
    # ---- STARTUP ----
    mongo = MongoService.get_instance()
    redis = RedisService.get_instance()
    graph = GraphService.get_instance()

    await mongo.connect()
    await redis.connect()

    # Build social graph from follows collection
    await graph.build_graph()

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
        "- **PYMK**: People You May Know (Graph-based CF)\n"
        "- **Post Feed**: Smart ForYou feed (Hybrid CF + Content-Based)"
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
    user_recommendations.router,
    prefix="/api/recommendations",
)
app.include_router(
    post_recommendations.router,
    prefix="/api/recommendations",
)


# ==================== HEALTH CHECK ====================


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check service health and connection status."""
    graph = GraphService.get_instance()
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
        graph_nodes=graph.graph.number_of_nodes() if graph.is_built else 0,
        graph_edges=graph.graph.number_of_edges() if graph.is_built else 0,
    )


@app.post("/api/recommendations/graph/rebuild", tags=["Admin"])
async def rebuild_graph():
    """Force rebuild the social graph (admin endpoint)."""
    graph = GraphService.get_instance()
    await graph.build_graph(force=True)
    return {
        "status": "ok",
        "nodes": graph.graph.number_of_nodes(),
        "edges": graph.graph.number_of_edges(),
    }
