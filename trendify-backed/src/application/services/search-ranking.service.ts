import { PostEntity } from "@/domain/post";
import { UserEntity } from "@/domain/user";

// ============================================================================
// SEARCH RANKING SERVICE
// ============================================================================

/**
 * Relevance scoring system for search results.
 * Calculates weighted scores based on multiple factors.
 */
export class SearchRankingService {
  // --------------------------------------------------------------------------
  // User Ranking
  // --------------------------------------------------------------------------

  /**
   * Calculate relevance score for a user in search results
   *
   * Factors:
   * - textScore: MongoDB text search score (40%)
   * - followerCount: Popularity signal (20%)
   * - isVerified: Trust bonus (10%)
   * - accountAge: Established account bonus (5%)
   * - mutualConnection: Personalization (25%)
   */
  static scoreUser(
    user: UserEntity,
    options: {
      textScore?: number;
      isFollowing?: boolean;
      isFollowedBy?: boolean;
      viewerFollowingIds?: Set<string>;
    },
  ): number {
    const { textScore = 1, isFollowing = false, isFollowedBy = false } = options;

    // Text match (0-1 normalized, weight 40%)
    const textFactor = Math.min(textScore / 5, 1) * 0.4;

    // Follower count (log-normalized, weight 20%)
    const followerCount = user.data.followerCount ?? 0;
    const followerFactor = Math.min(Math.log10(followerCount + 1) / 6, 1) * 0.2;

    // Verified bonus (weight 10%)
    const verifiedFactor = user.data.isVerified ? 0.1 : 0;

    // Account age (weight 5%)
    const ageMs = Date.now() - new Date(user.data.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const ageFactor = Math.min(ageDays / 365, 1) * 0.05;

    // Mutual connections (weight 25%)
    let mutualFactor = 0;
    if (isFollowing) mutualFactor += 0.15; // Viewer follows this user → strong signal
    if (isFollowedBy) mutualFactor += 0.10; // This user follows viewer → moderate signal

    return textFactor + followerFactor + verifiedFactor + ageFactor + mutualFactor;
  }

  // --------------------------------------------------------------------------
  // Post Ranking
  // --------------------------------------------------------------------------

  /**
   * Calculate relevance score for a post in search results
   *
   * Factors:
   * - textScore: MongoDB text search score (35%)
   * - engagement: likes + comments + shares normalized (25%)
   * - recency: Decay function (20%)
   * - authorAuthority: follower count + verified (10%)
   * - mediaRichness: Posts with media rank higher (10%)
   */
  static scorePost(
    post: PostEntity,
    options: {
      textScore?: number;
      authorFollowerCount?: number;
      authorIsVerified?: boolean;
      isFollowingAuthor?: boolean;
    },
  ): number {
    const {
      textScore = 1,
      authorFollowerCount = 0,
      authorIsVerified = false,
      isFollowingAuthor = false,
    } = options;

    const counters = post.data.counters;

    // Text match (weight 35%)
    const textFactor = Math.min(textScore / 5, 1) * 0.35;

    // Engagement score (weight 25%)
    const totalEngagement =
      counters.likeCount +
      counters.commentCount * 2 + // Comments are more valuable
      counters.shareCount * 3 + // Shares are most valuable
      counters.saveCount * 1.5;
    const engagementFactor = Math.min(Math.log10(totalEngagement + 1) / 5, 1) * 0.25;

    // Recency decay (weight 20%)
    // Score = 1.0 for posts < 1 hour old, decays to 0.1 for posts > 30 days old
    const ageHours = (Date.now() - new Date(post.data.createdAt).getTime()) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0.1, 1 / (1 + ageHours / 24)) * 0.2;

    // Author authority (weight 10%)
    const authorBase = Math.min(Math.log10(authorFollowerCount + 1) / 6, 1);
    const authorFactor = (authorBase + (authorIsVerified ? 0.3 : 0)) * 0.1;

    // Media richness (weight 10%)
    const hasMedia = post.hasMedia();
    const mediaFactor = hasMedia ? 0.1 : 0.02;

    // Personalization boost: following author
    const followBoost = isFollowingAuthor ? 0.05 : 0;

    return textFactor + engagementFactor + recencyFactor + authorFactor + mediaFactor + followBoost;
  }

  // --------------------------------------------------------------------------
  // Hashtag Ranking
  // --------------------------------------------------------------------------

  /**
   * Calculate relevance score for a hashtag
   *
   * Factors:
   * - postCount: Total usage (50%)
   * - recentUsage: Posts within 7 days (35%)
   * - trendingVelocity: Growth rate (15%)
   */
  static scoreHashtag(options: {
    postCount: number;
    recentPostCount?: number;
    previousPeriodCount?: number;
  }): number {
    const { postCount, recentPostCount = 0, previousPeriodCount = 0 } = options;

    // Post count (weight 50%)
    const countFactor = Math.min(Math.log10(postCount + 1) / 5, 1) * 0.5;

    // Recent usage (weight 35%)
    const recentFactor = Math.min(Math.log10(recentPostCount + 1) / 4, 1) * 0.35;

    // Trending velocity (weight 15%)
    // Ratio of recent to previous period
    let velocityFactor = 0;
    if (previousPeriodCount > 0) {
      const ratio = recentPostCount / previousPeriodCount;
      velocityFactor = Math.min(ratio / 5, 1) * 0.15;
    } else if (recentPostCount > 0) {
      velocityFactor = 0.15; // New trending hashtag
    }

    return countFactor + recentFactor + velocityFactor;
  }

  // --------------------------------------------------------------------------
  // Sorting Helpers
  // --------------------------------------------------------------------------

  /**
   * Sort items bằng relevance score (desc)
   */
  static sortByScore<T>(
    items: T[],
    scorer: (item: T) => number,
  ): Array<T & { _score: number }> {
    return items
      .map((item) => ({
        ...item,
        _score: scorer(item),
      }))
      .sort((a, b) => b._score - a._score);
  }
}
