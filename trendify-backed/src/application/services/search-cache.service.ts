import { ICacheService } from "@/application/services";

// ============================================================================
// SEARCH CACHE SERVICE
// ============================================================================

/** Cache TTL strategy (in seconds) */
const CACHE_TTL = {
  USER_SEARCH: 5 * 60, // 5 phút
  POST_SEARCH: 3 * 60, // 3 phút
  HASHTAG_SEARCH: 10 * 60, // 10 phút
  TRENDING: 15 * 60, // 15 phút
  AUTOCOMPLETE: 2 * 60, // 2 phút
  FEDERATED: 2 * 60, // 2 phút
} as const;

export type SearchCacheType = keyof typeof CACHE_TTL;

// ============================================================================
// INTERFACE
// ============================================================================

export interface ISearchCacheService {
  getCachedResults<T>(cacheKey: string): Promise<T | null>;
  setCachedResults<T>(cacheKey: string, data: T, type: SearchCacheType): Promise<void>;
  buildCacheKey(type: string, query: string, filters?: Record<string, unknown>): string;
  invalidateByType(type: string): Promise<void>;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class SearchCacheService implements ISearchCacheService {
  private readonly PREFIX = "search:cache:";

  constructor(private readonly cacheService: ICacheService) {}

  async getCachedResults<T>(cacheKey: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(cacheKey);
    } catch {
      // Cache failure → return null (fallback to DB)
      return null;
    }
  }

  async setCachedResults<T>(
    cacheKey: string,
    data: T,
    type: SearchCacheType,
  ): Promise<void> {
    try {
      const ttl = CACHE_TTL[type];
      await this.cacheService.set(cacheKey, data, ttl);
    } catch {
      // Cache failure → skip silently
    }
  }

  /**
   * Build deterministic cache key từ type, query, và filters
   * Example: "search:cache:users:q=john:limit=10:cursor=abc"
   */
  buildCacheKey(
    type: string,
    query: string,
    filters?: Record<string, unknown>,
  ): string {
    const parts = [this.PREFIX + type, `q=${query.toLowerCase().trim()}`];

    if (filters) {
      // Sort filter keys for deterministic key
      const sortedKeys = Object.keys(filters).sort();
      for (const key of sortedKeys) {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== "") {
          parts.push(`${key}=${String(value)}`);
        }
      }
    }

    return parts.join(":");
  }

  /**
   * Invalidate tất cả cache entries cho 1 loại search
   */
  async invalidateByType(type: string): Promise<void> {
    try {
      await this.cacheService.delByPrefix(`${this.PREFIX}${type}`);
    } catch {
      // Failure → skip silently
    }
  }
}
