import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
const router = Router();
const auth = authMiddleware();

/**
 * Proxy middleware: forwards authenticated requests to the Python AI service.
 * Node.js handles auth verification; Python handles recommendation logic.
 */
const proxyToAI = async (req: Request, res: Response) => {
  try {
    const userId = res.locals?.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Map Node.js route to Python AI service route
    // /api/ai/suggestions/:userId  →  /api/recommendations/users/:userId
    // /api/ai/feed/:userId         →  /api/recommendations/posts/:userId
    // /api/ai/dismiss              →  /api/recommendations/dismiss (POST)
    // /api/ai/graph/rebuild        →  /api/recommendations/graph/rebuild (POST)
    let aiPath = req.path;
    if (aiPath.startsWith("/suggestions")) {
      aiPath = aiPath.replace("/suggestions", "/users");
    } else if (aiPath.startsWith("/feed")) {
      aiPath = aiPath.replace("/feed", "/posts");
    }

    const targetUrl = new URL(`/api/recommendations${aiPath}`, AI_SERVICE_URL);

    // Forward query params
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        targetUrl.searchParams.set(key, value);
      }
    }

    const isGet = req.method === "GET";

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (!isGet && req.body) {
      fetchOptions.body = JSON.stringify({
        ...req.body,
        user_id: userId,
      });
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    if (!response.ok) {
      console.error(`[AI Proxy] Python service returned ${response.status}`);
      return res.status(response.status).json({
        message: "AI service error",
        status: response.status,
      });
    }

    const data = await response.json();
    return res.json({ status: 200, data });
  } catch (error: any) {
    console.error("[AI Proxy] Failed to reach AI service:", error?.message);
    // Graceful fallback
    return res.json({
      status: 200,
      data: {
        suggestions: [],
        postIds: [],
        meta: { fallback: true, reason: "AI service unavailable" },
      },
    });
  }
};

// ====================== ROUTES ======================

// PYMK suggestions: GET /api/ai/suggestions/:userId
router.get("/suggestions/:userId", auth, proxyToAI);

// Post recommendations (ForYou feed): GET /api/ai/feed/:userId
router.get("/feed/:userId", auth, proxyToAI);

// Dismiss a suggestion: POST /api/ai/dismiss
router.post("/dismiss", auth, proxyToAI);

// Rebuild graph (admin): POST /api/ai/graph/rebuild
router.post("/graph/rebuild", auth, proxyToAI);

export default router;
