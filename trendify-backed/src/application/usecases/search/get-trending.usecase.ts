import { GetTrendingDTO } from "@/application/dtos/search.dto";
import { ICacheService } from "@/application/services";
import { PostModel } from "@/infrastructure/database/models/post.model";

// ============================================================================
// TRENDING TYPES
// ============================================================================

export interface TrendingItem {
  keyword: string;
  type: "keyword" | "hashtag";
  score: number;
}

// ============================================================================
// REDIS KEYS
// ============================================================================

/** Sorted set: keyword → search frequency score */
const TRENDING_KEYWORDS_KEY = "search:trending";

/** Cache key for pre-computed trending list */
const TRENDING_CACHE_KEY = "search:trending:cache";

/** Cache TTL: 15 phút */
const TRENDING_CACHE_TTL = 15 * 60;

// ============================================================================
// GET TRENDING USE CASE
// ============================================================================

export class GetTrendingUseCase {
  constructor(private readonly cacheService: ICacheService) {}

  async execute(dto: GetTrendingDTO) {
    const { limit = 20 } = dto;

    // Check cache first
    const cached = await this.cacheService.get<TrendingItem[]>(TRENDING_CACHE_KEY);
    if (cached) {
      return { trending: cached.slice(0, limit) };
    }

    // Fetch from both sources in parallel
    const [trendingKeywords, trendingHashtags] = await Promise.allSettled([
      this.getTrendingKeywords(10),
      this.getTrendingHashtags(10),
    ]);

    const items: TrendingItem[] = [];

    // Trending keywords from Redis sorted set
    if (trendingKeywords.status === "fulfilled") {
      items.push(...trendingKeywords.value);
    }

    // Trending hashtags from post aggregation
    if (trendingHashtags.status === "fulfilled") {
      items.push(...trendingHashtags.value);
    }

    // Sort by score desc
    items.sort((a, b) => b.score - a.score);

    const result = items.slice(0, limit);

    // Cache for 15 minutes
    try {
      await this.cacheService.set(TRENDING_CACHE_KEY, result, TRENDING_CACHE_TTL);
    } catch {
      // Cache failure: không ảnh hưởng response
    }

    return { trending: result };
  }

  /**
   * Track search keyword cho trending
   * Gọi method này mỗi khi user search
   */
  static async trackSearch(cacheService: ICacheService, keyword: string): Promise<void> {
    try {
      const normalized = keyword.toLowerCase().trim();
      if (normalized.length < 2) return;

      // ZINCRBY: tăng score của keyword trong sorted set
      await cacheService.zadd(TRENDING_KEYWORDS_KEY, Date.now(), normalized);

      // Set TTL 24h nếu key mới
      const ttl = await cacheService.ttl(TRENDING_KEYWORDS_KEY);
      if (ttl === -1) {
        await cacheService.expire(TRENDING_KEYWORDS_KEY, 24 * 60 * 60);
      }

      // Invalidate cache
      await cacheService.del(TRENDING_CACHE_KEY);
    } catch {
      // Fire-and-forget
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private async getTrendingKeywords(limit: number): Promise<TrendingItem[]> {
    // Lấy top keywords từ Redis sorted set
    // Vì ICacheService không có zrevrange, dùng get cached list instead
    const data = await this.cacheService.get<string[]>("search:trending:keywords");
    if (!data) return [];

    return data.slice(0, limit).map((keyword, index) => ({
      keyword,
      type: "keyword" as const,
      score: limit - index, // Higher rank = higher score
    }));
  }

  private async getTrendingHashtags(limit: number): Promise<TrendingItem[]> {
    // Aggregate top hashtags trong 7 ngày gần đây
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await PostModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          status: "active",
          "settings.visibility": "public",
          createdAt: { $gte: sevenDaysAgo },
          "hashtags.0": { $exists: true }, // posts có ít nhất 1 hashtag
        },
      },
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags.tag",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return results.map((r) => ({
      keyword: `#${r._id}`,
      type: "hashtag" as const,
      score: r.count,
    }));
  }
}
