import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

import {
  MongoosePostRepository,
  MongooseLikeRepository,
  MongooseSaveRepository,
  MongooseUserRepository,
  MongooseFollowRepository,
  MongooseBlockRepository,
} from "@/infrastructure/database/repositories";
import { MongooseMediaRepository } from "@/infrastructure/database/repositories/media.repository.impl";
import S3Service from "@/infrastructure/services/s3.service";
import { GetForYouFeedUseCase } from "@/application/usecases/post";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
const router = Router();
const auth = authMiddleware();

// Repositories for data enrichment
const postRepo = new MongoosePostRepository();
const likeRepo = new MongooseLikeRepository();
const saveRepo = new MongooseSaveRepository();
const userRepo = new MongooseUserRepository();
const followRepo = new MongooseFollowRepository();
const blockRepo = new MongooseBlockRepository();
const mediaRepo = new MongooseMediaRepository();
const storageSvc = new S3Service();

const getForYouFeedUseCase = new GetForYouFeedUseCase(
  postRepo,
  followRepo,
  blockRepo,
  likeRepo,
  saveRepo,
  mediaRepo,
  userRepo,
  storageSvc,
);

/**
 * ForYou Feed: calls Python AI → ranked postIds → enriches with full post data.
 */
const getForYouFeed = async (req: Request, res: Response) => {
  try {
    const userId = res.locals?.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = req.query.page || "0";
    const limit = req.query.limit || "20";

    const targetUrl = new URL(
      `/api/recommendations/posts/${userId}`,
      AI_SERVICE_URL,
    );
    targetUrl.searchParams.set("page", String(page));
    targetUrl.searchParams.set("limit", String(limit));

    const aiResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!aiResponse.ok) {
      console.error(`[AI Feed] Python service returned ${aiResponse.status}`);
      return res.json({
        status: 200,
        data: { posts: [], nextCursor: null, meta: { fallback: true } },
      });
    }

    const aiData = await aiResponse.json();
    const { postIds = [], nextCursor, meta = {} } = aiData;

    if (postIds.length === 0) {
      return res.json({
        status: 200,
        data: { posts: [], nextCursor: null, meta },
      });
    }

    // Enrich post IDs with full post data
    const result = await getForYouFeedUseCase.execute({
      viewerId: userId,
      postIds,
      nextCursor: nextCursor || null,
      meta,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[AI Feed] Error:", error?.message);
    return res.json({
      status: 200,
      data: { posts: [], nextCursor: null, meta: { fallback: true } },
    });
  }
};

// ====================== ROUTES ======================

// Post recommendations (ForYou feed): GET /api/ai/feed
router.get("/feed", auth, getForYouFeed);

export default router;
