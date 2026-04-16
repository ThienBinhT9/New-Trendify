"""
Post Recommendation Engine.

Hybrid approach combining 3 strategies:
  1. Content-Based Filtering  (TF-IDF + Cosine Similarity)
  2. Collaborative Filtering  (KNN-based co-interaction)
  3. Popularity + Freshness   (Engagement × Time Decay)

Adaptive weights based on user's interaction history (Cold Start handling).
"""

import time
from datetime import datetime, timedelta, timezone

import numpy as np
from bson import ObjectId
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.mongo_service import MongoService
from app.services.redis_service import RedisService
from app.utils.normalization import min_max_normalize, time_decay


# Cache TTL
POST_CACHE_TTL = 30 * 60  # 30 minutes


class PostRecommendationEngine:
    def __init__(self):
        self.mongo = MongoService.get_instance()
        self.redis = RedisService.get_instance()

    async def recommend(
        self,
        user_id: str,
        limit: int = 20,
        cursor: str | None = None,
        page: int = 0,
    ) -> dict:
        start_time = time.time()

        # ============ CHECK CACHE ============
        cache_key = f"ai:feed:{user_id}:p{page}"
        cached = await self.redis.get(cache_key)
        if cached:
            return {**cached, "meta": {**cached.get("meta", {}), "source": "cache"}}

        user_oid = ObjectId(user_id)

        # ============ BUILD USER PROFILE ============
        liked_ids, saved_ids, commented_ids, following_ids = await self._build_user_profile(user_oid)

        interacted_ids = set(liked_ids + saved_ids + commented_ids)
        interaction_count = len(interacted_ids)

        # ============ ADAPTIVE WEIGHTS (Cold Start Handling) ============
        if interaction_count < 5:
            weights = {"content": 0.10, "cf": 0.05, "popularity": 0.85}
        elif interaction_count < 20:
            weights = {"content": 0.30, "cf": 0.20, "popularity": 0.50}
        elif interaction_count < 50:
            weights = {"content": 0.35, "cf": 0.30, "popularity": 0.35}
        else:
            weights = {"content": 0.40, "cf": 0.35, "popularity": 0.25}

        # ============ FETCH CANDIDATE POSTS ============
        now = datetime.now(timezone.utc)
        candidate_oid_exclusions = [ObjectId(pid) for pid in interacted_ids if ObjectId.is_valid(pid)]

        candidate_filter = {
            "status": "active",
            "settings.visibility": "public",
            "replyToId": None,  # No replies
            "createdAt": {"$gte": now - timedelta(days=14)},
        }

        if candidate_oid_exclusions:
            candidate_filter["_id"] = {"$nin": candidate_oid_exclusions}

        candidates = await self.mongo.posts.find(
            candidate_filter,
            {
                "_id": 1,
                "authorId": 1,
                "content": 1,
                "hashtags": 1,
                "counters": 1,
                "createdAt": 1,
                "type": 1,
            },
        ).sort("createdAt", -1).to_list(500)

        if not candidates:
            result = {
                "postIds": [],
                "scores": [],
                "nextCursor": None,
                "meta": {
                    "strategy": weights,
                    "candidateCount": 0,
                    "userInteractions": interaction_count,
                    "coldStart": interaction_count < 5,
                    "computeTimeMs": int((time.time() - start_time) * 1000),
                },
            }
            return result

        # ============ STRATEGY 1: CONTENT-BASED FILTERING ============
        content_scores = await self._content_based_scores(
            user_oid, interacted_ids, candidates
        )

        # ============ STRATEGY 2: COLLABORATIVE FILTERING ============
        cf_scores = await self._collaborative_scores(
            user_oid, candidates, liked_ids
        )

        # ============ STRATEGY 3: POPULARITY + FRESHNESS ============
        pop_scores = self._popularity_scores(candidates, now)

        # ============ NORMALIZE ============
        content_norm = min_max_normalize(np.array(content_scores))
        cf_norm = min_max_normalize(np.array(cf_scores))
        pop_norm = min_max_normalize(np.array(pop_scores))

        # ============ HYBRID FUSION ============
        final_scores = (
            weights["content"] * content_norm
            + weights["cf"] * cf_norm
            + weights["popularity"] * pop_norm
        )

        # ============ FOLLOWING BOOST ============
        following_set = set(following_ids)
        for i, post in enumerate(candidates):
            author_id = str(post["authorId"])
            if author_id in following_set:
                final_scores[i] *= 1.25  # 25% boost for followed authors

        # ============ DIVERSITY INJECTION ============
        # Avoid too many posts from same author
        final_scores = self._apply_author_diversity(candidates, final_scores)

        # ============ SORT & PAGINATE ============
        ranked_indices = np.argsort(-final_scores)

        # Pagination
        start_idx = page * limit
        end_idx = start_idx + limit
        page_indices = ranked_indices[start_idx:end_idx]

        post_ids = [str(candidates[i]["_id"]) for i in page_indices]
        scores = [round(float(final_scores[i]), 4) for i in page_indices]

        has_next = end_idx < len(ranked_indices)

        compute_time = int((time.time() - start_time) * 1000)

        result = {
            "postIds": post_ids,
            "scores": scores,
            "nextCursor": str(page + 1) if has_next else None,
            "meta": {
                "strategy": weights,
                "candidateCount": len(candidates),
                "userInteractions": interaction_count,
                "coldStart": interaction_count < 5,
                "computeTimeMs": compute_time,
            },
        }

        # Cache
        await self.redis.set(cache_key, result, ttl=POST_CACHE_TTL)

        return result

    # ==================== STRATEGY 1: CONTENT-BASED ====================

    async def _content_based_scores(
        self,
        user_oid: ObjectId,
        interacted_ids: set[str],
        candidates: list[dict],
    ) -> list[float]:
        """Score candidates by content similarity to user's interaction history."""

        # Build user taste profile from interacted posts
        interacted_oids = [
            ObjectId(pid)
            for pid in interacted_ids
            if ObjectId.is_valid(pid)
        ]

        if not interacted_oids:
            return [0.0] * len(candidates)

        interacted_posts = await self.mongo.posts.find(
            {"_id": {"$in": interacted_oids[:200]}},
            {"content": 1, "hashtags": 1},
        ).to_list(200)

        if not interacted_posts:
            return [0.0] * len(candidates)

        # Build text corpus
        user_text = " ".join(self._post_to_text(p) for p in interacted_posts)

        if not user_text.strip():
            return [0.0] * len(candidates)

        candidate_texts = [self._post_to_text(p) for p in candidates]

        # TF-IDF Vectorization
        corpus = [user_text] + candidate_texts
        try:
            tfidf = TfidfVectorizer(
                max_features=2000,
                ngram_range=(1, 2),
                min_df=1,
            )
            vectors = tfidf.fit_transform(corpus)

            # Cosine similarity: user profile vs each candidate
            user_vec = vectors[0:1]
            post_vecs = vectors[1:]
            similarities = cosine_similarity(user_vec, post_vecs).flatten()

            return similarities.tolist()
        except ValueError:
            # TF-IDF can fail on empty corpus
            return [0.0] * len(candidates)

    # ==================== STRATEGY 2: COLLABORATIVE FILTERING ====================

    async def _collaborative_scores(
        self,
        user_oid: ObjectId,
        candidates: list[dict],
        user_liked_ids: list[str],
    ) -> list[float]:
        """
        KNN-based CF: find similar users, score = how many similar users
        interacted with each candidate.
        """
        if not user_liked_ids:
            return [0.0] * len(candidates)

        liked_oids = [
            ObjectId(pid) for pid in user_liked_ids[:100] if ObjectId.is_valid(pid)
        ]

        # Find users who liked the same posts (K nearest neighbors by co-likes)
        pipeline = [
            {"$match": {"postId": {"$in": liked_oids}, "userId": {"$ne": user_oid}}},
            {"$group": {"_id": "$userId", "overlap": {"$sum": 1}}},
            {"$sort": {"overlap": -1}},
            {"$limit": 50},  # Top 50 similar users
        ]

        similar_users = await self.mongo.likes.aggregate(pipeline).to_list(50)

        if not similar_users:
            return [0.0] * len(candidates)

        similar_user_ids = [doc["_id"] for doc in similar_users]
        # Weight by overlap count
        user_weights = {str(doc["_id"]): doc["overlap"] for doc in similar_users}

        # Find which candidates these similar users liked
        candidate_oids = [c["_id"] for c in candidates]

        cf_pipeline = [
            {
                "$match": {
                    "userId": {"$in": similar_user_ids},
                    "postId": {"$in": candidate_oids},
                }
            },
            {
                "$group": {
                    "_id": "$postId",
                    "likers": {"$addToSet": "$userId"},
                }
            },
        ]

        cf_results = await self.mongo.likes.aggregate(cf_pipeline).to_list(
            len(candidates)
        )

        # Build score map: weighted count of similar users who liked
        post_cf_scores: dict[str, float] = {}
        for doc in cf_results:
            post_id = str(doc["_id"])
            score = sum(
                user_weights.get(str(uid), 1) for uid in doc["likers"]
            )
            post_cf_scores[post_id] = score

        return [post_cf_scores.get(str(c["_id"]), 0.0) for c in candidates]

    # ==================== STRATEGY 3: POPULARITY + FRESHNESS ====================

    def _popularity_scores(
        self, candidates: list[dict], now: datetime
    ) -> list[float]:
        """Score based on engagement metrics × time decay."""
        scores = []
        for post in candidates:
            counters = post.get("counters", {})

            # Weighted engagement score
            engagement = (
                counters.get("likeCount", 0) * 1.0
                + counters.get("commentCount", 0) * 2.0
                + counters.get("saveCount", 0) * 3.0
                + counters.get("shareCount", 0) * 2.5
                + counters.get("viewCount", 0) * 0.1
            )

            # Time decay
            created_at = post.get("createdAt", now)
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            age_hours = max(0, (now - created_at).total_seconds() / 3600)
            freshness = time_decay(age_hours, half_life_hours=72)

            scores.append(engagement * freshness)

        return scores

    # ==================== DIVERSITY ====================

    def _apply_author_diversity(
        self,
        candidates: list[dict],
        scores: np.ndarray,
        max_per_author: int = 3,
    ) -> np.ndarray:
        """Penalize posts from over-represented authors to diversify feed."""
        author_counts: dict[str, int] = {}
        # Sort by score to process top first
        ranked = np.argsort(-scores)

        new_scores = scores.copy()
        for idx in ranked:
            author_id = str(candidates[idx]["authorId"])
            count = author_counts.get(author_id, 0)
            if count >= max_per_author:
                new_scores[idx] *= 0.3  # Heavy penalty after 3 posts
            author_counts[author_id] = count + 1

        return new_scores

    # ==================== HELPERS ====================

    def _post_to_text(self, post: dict) -> str:
        """Convert post to text representation for TF-IDF."""
        parts = []
        content = post.get("content", "")
        if content:
            parts.append(content)
        for ht in post.get("hashtags", []):
            tag = ht.get("tag", "")
            if tag:
                # Repeat hashtags for emphasis in TF-IDF
                parts.append(tag)
                parts.append(tag)
        return " ".join(parts)

    async def _build_user_profile(
        self, user_oid: ObjectId
    ) -> tuple[list[str], list[str], list[str], list[str]]:
        """Fetch user's interaction history in parallel."""
        import asyncio

        async def get_liked():
            docs = await self.mongo.likes.find(
                {"userId": user_oid}, {"postId": 1}
            ).sort("_id", -1).to_list(300)
            return [str(d["postId"]) for d in docs]

        async def get_saved():
            docs = await self.mongo.saves.find(
                {"userId": user_oid}, {"postId": 1}
            ).sort("_id", -1).to_list(200)
            return [str(d["postId"]) for d in docs]

        async def get_commented():
            docs = await self.mongo.comments.find(
                {"authorId": user_oid, "status": "active"}, {"postId": 1}
            ).sort("_id", -1).to_list(200)
            return [str(d["postId"]) for d in docs]

        async def get_following():
            docs = await self.mongo.follows.find(
                {"followerId": user_oid, "status": "ACCEPTED"},
                {"followingId": 1},
            ).to_list(None)
            return [str(d["followingId"]) for d in docs]

        liked, saved, commented, following = await asyncio.gather(
            get_liked(), get_saved(), get_commented(), get_following()
        )

        return liked, saved, commented, following
