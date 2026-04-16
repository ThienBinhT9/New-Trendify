"""
People You May Know (PYMK) Engine.

Pipeline:
  Stage 1 — Candidate Generation  (FoF + co-interaction)
  Stage 2 — Multi-Signal Scoring  (Jaccard, Adamic-Adar, affinity, content)
  Stage 3 — Filtering & Ranking   (block, dismiss, dedup, top-K)
"""

import time
import numpy as np
from bson import ObjectId

from app.services.mongo_service import MongoService
from app.services.redis_service import RedisService
from app.services.graph_service import GraphService
from app.utils.normalization import min_max_normalize


# Scoring weights — tunable
WEIGHTS = {
    "mutual_followers": 0.30,
    "jaccard": 0.25,
    "adamic_adar": 0.20,
    "interaction_affinity": 0.15,
    "content_similarity": 0.10,
}

# Cache TTL
PYMK_CACHE_TTL = 2 * 60 * 60  # 2 hours
DISMISSED_TTL = 30 * 24 * 60 * 60  # 30 days


class PYMKEngine:
    def __init__(self):
        self.mongo = MongoService.get_instance()
        self.redis = RedisService.get_instance()
        self.graph = GraphService.get_instance()

    async def recommend(
        self, user_id: str, limit: int = 20
    ) -> dict:
        start_time = time.time()

        # ============ CHECK CACHE ============
        cache_key = f"ai:pymk:{user_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return {
                "suggestions": cached[:limit],
                "meta": {"source": "cache", "computeTimeMs": 0},
            }

        # ============ STAGE 1: CANDIDATE GENERATION ============
        # Ensure graph is built
        if not self.graph.is_built:
            await self.graph.build_graph()

        # 1a. Friends of Friends
        fof_candidates = self.graph.get_friends_of_friends(user_id, limit=200)

        # 1b. Co-interaction users (like same posts)
        interaction_candidates = await self._find_co_interaction_users(
            user_id, limit=100
        )

        # Merge candidate pools
        all_candidate_ids = set(fof_candidates.keys()) | set(
            interaction_candidates.keys()
        )

        if not all_candidate_ids:
            return {
                "suggestions": [],
                "meta": {
                    "totalCandidates": 0,
                    "computeTimeMs": int((time.time() - start_time) * 1000),
                },
            }

        candidate_list = list(all_candidate_ids)

        # ============ STAGE 2: MULTI-SIGNAL SCORING ============

        # Signal 1: Mutual followers count
        mutual_counts = self.graph.mutual_followers_count(user_id, candidate_list)

        # Signal 2: Jaccard coefficient
        jaccard_scores = self.graph.jaccard_coefficient(user_id, candidate_list)

        # Signal 3: Adamic-Adar index
        aa_scores = self.graph.adamic_adar_index(user_id, candidate_list)

        # Signal 4: Interaction affinity (from co-interaction data)
        interaction_scores = {
            c: interaction_candidates.get(c, 0) for c in candidate_list
        }

        # Signal 5: Content similarity (shared hashtags)
        content_scores = await self._compute_content_similarity(
            user_id, candidate_list
        )

        # Normalize all scores to [0, 1]
        mutual_arr = np.array([mutual_counts.get(c, 0) for c in candidate_list], dtype=float)
        jaccard_arr = np.array([jaccard_scores.get(c, 0.0) for c in candidate_list])
        aa_arr = np.array([aa_scores.get(c, 0.0) for c in candidate_list])
        interact_arr = np.array([interaction_scores.get(c, 0) for c in candidate_list], dtype=float)
        content_arr = np.array([content_scores.get(c, 0.0) for c in candidate_list])

        mutual_norm = min_max_normalize(mutual_arr)
        aa_norm = min_max_normalize(aa_arr)
        interact_norm = min_max_normalize(interact_arr)
        content_norm = min_max_normalize(content_arr)
        # Jaccard is already 0-1

        # Weighted combination
        final_scores = (
            WEIGHTS["mutual_followers"] * mutual_norm
            + WEIGHTS["jaccard"] * jaccard_arr
            + WEIGHTS["adamic_adar"] * aa_norm
            + WEIGHTS["interaction_affinity"] * interact_norm
            + WEIGHTS["content_similarity"] * content_norm
        )

        # ============ STAGE 3: FILTER & RANK ============

        # Get blocked + dismissed IDs
        blocked_ids = await self._get_blocked_ids(user_id)
        dismissed_ids = await self._get_dismissed_ids(user_id)
        exclude = blocked_ids | dismissed_ids

        # Build result list
        scored_candidates = []
        for i, cid in enumerate(candidate_list):
            if cid in exclude:
                continue

            mutual_through = fof_candidates.get(cid, [])
            mc = int(mutual_counts.get(cid, 0))

            # Build explanation
            if mc > 0:
                explanation = f"{mc} người theo dõi chung"
            elif interaction_scores.get(cid, 0) > 0:
                explanation = "Có sở thích tương tự"
            elif content_scores.get(cid, 0) > 0:
                explanation = "Quan tâm chủ đề tương tự"
            else:
                explanation = "Gợi ý cho bạn"

            scored_candidates.append(
                {
                    "userId": cid,
                    "score": round(float(final_scores[i]), 4),
                    "mutualCount": mc,
                    "mutualUsers": mutual_through[:5],
                    "source": "friends_of_friends" if cid in fof_candidates else "interaction",
                    "explanation": explanation,
                }
            )

        # Sort by score descending
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        top_results = scored_candidates[:limit]

        # Cache results
        compute_time = int((time.time() - start_time) * 1000)
        await self.redis.set(cache_key, scored_candidates[:50], ttl=PYMK_CACHE_TTL)

        return {
            "suggestions": top_results,
            "meta": {
                "totalCandidates": len(all_candidate_ids),
                "algorithm": "graph_hybrid_cf",
                "computeTimeMs": compute_time,
                "weights": WEIGHTS,
            },
        }

    # ==================== DISMISS ====================

    async def dismiss(self, user_id: str, target_id: str) -> None:
        """Mark a suggestion as dismissed—won't appear again for 30 days."""
        key = f"ai:pymk:{user_id}:dismissed"
        await self.redis.sadd(key, target_id)
        await self.redis.expire(key, DISMISSED_TTL)
        # Invalidate cached suggestions
        await self.redis.delete(f"ai:pymk:{user_id}")

    # ==================== PRIVATE: DATA FETCHING ====================

    async def _find_co_interaction_users(
        self, user_id: str, limit: int = 100
    ) -> dict[str, int]:
        """
        Find users who liked/commented on the same posts as user_id.
        Returns: { candidate_id: co_interaction_count }
        """
        user_oid = ObjectId(user_id)

        # Get posts the user liked
        user_likes = await self.mongo.likes.find(
            {"userId": user_oid}, {"postId": 1}
        ).to_list(200)

        if not user_likes:
            return {}

        liked_post_ids = [l["postId"] for l in user_likes]

        # Find other users who liked the same posts
        pipeline = [
            {"$match": {"postId": {"$in": liked_post_ids}, "userId": {"$ne": user_oid}}},
            {"$group": {"_id": "$userId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
        ]

        co_likers = await self.mongo.likes.aggregate(pipeline).to_list(limit)

        result = {}
        for doc in co_likers:
            result[str(doc["_id"])] = doc["count"]

        # Also check co-commenters
        user_comments = await self.mongo.comments.find(
            {"authorId": user_oid, "status": "active"}, {"postId": 1}
        ).to_list(200)

        if user_comments:
            commented_post_ids = [c["postId"] for c in user_comments]

            comment_pipeline = [
                {
                    "$match": {
                        "postId": {"$in": commented_post_ids},
                        "authorId": {"$ne": user_oid},
                        "status": "active",
                    }
                },
                {"$group": {"_id": "$authorId", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]

            co_commenters = await self.mongo.comments.aggregate(
                comment_pipeline
            ).to_list(limit)

            for doc in co_commenters:
                uid = str(doc["_id"])
                result[uid] = result.get(uid, 0) + doc["count"] * 2  # Comments are weighted more

        return result

    async def _compute_content_similarity(
        self, user_id: str, candidate_ids: list[str]
    ) -> dict[str, float]:
        """
        Compute content similarity based on shared hashtags.
        Returns: { candidate_id: similarity_score }
        """
        user_oid = ObjectId(user_id)

        # Get user's hashtags
        user_posts = await self.mongo.posts.find(
            {
                "authorId": user_oid,
                "status": "active",
                "hashtags.0": {"$exists": True},
            },
            {"hashtags.tag": 1},
        ).to_list(100)

        if not user_posts:
            return {c: 0.0 for c in candidate_ids}

        user_tags = set()
        for post in user_posts:
            for ht in post.get("hashtags", []):
                user_tags.add(ht["tag"])

        if not user_tags:
            return {c: 0.0 for c in candidate_ids}

        # Get candidates' hashtags
        candidate_oids = [ObjectId(c) for c in candidate_ids]

        pipeline = [
            {
                "$match": {
                    "authorId": {"$in": candidate_oids},
                    "status": "active",
                    "hashtags.0": {"$exists": True},
                }
            },
            {"$unwind": "$hashtags"},
            {
                "$group": {
                    "_id": "$authorId",
                    "tags": {"$addToSet": "$hashtags.tag"},
                }
            },
        ]

        candidate_tags = await self.mongo.posts.aggregate(pipeline).to_list(
            len(candidate_ids)
        )

        tag_map = {str(doc["_id"]): set(doc["tags"]) for doc in candidate_tags}

        result = {}
        for c in candidate_ids:
            c_tags = tag_map.get(c, set())
            if not c_tags:
                result[c] = 0.0
            else:
                # Jaccard similarity on hashtag sets
                intersection = len(user_tags & c_tags)
                union = len(user_tags | c_tags)
                result[c] = intersection / union if union > 0 else 0.0

        return result

    async def _get_blocked_ids(self, user_id: str) -> set[str]:
        """Get bidirectional blocked user IDs."""
        user_oid = ObjectId(user_id)
        blocks = await self.mongo.blocks.find(
            {"$or": [{"blockerId": user_oid}, {"blockedId": user_oid}]}
        ).to_list(None)

        blocked = set()
        for b in blocks:
            blocked.add(str(b["blockerId"]))
            blocked.add(str(b["blockedId"]))
        blocked.discard(user_id)
        return blocked

    async def _get_dismissed_ids(self, user_id: str) -> set[str]:
        """Get dismissed suggestion IDs from Redis."""
        key = f"ai:pymk:{user_id}:dismissed"
        return await self.redis.smembers(key)
