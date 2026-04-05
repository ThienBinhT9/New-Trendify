import * as Response from "@/shared/responses";
import { FederatedSearchDTO } from "@/application/dtos/search.dto";
import { SearchUsersUseCase } from "./search-users.usecase";
import { SearchPostsUseCase } from "./search-posts.usecase";
import { SearchHashtagsUseCase } from "./search-hashtags.usecase";
import { ISearchCacheService } from "@/application/services/search-cache.service";

// ============================================================================
// FEDERATED SEARCH USE CASE
// ============================================================================

export class FederatedSearchUseCase {
  constructor(
    private readonly searchUsersUC: SearchUsersUseCase,
    private readonly searchPostsUC: SearchPostsUseCase,
    private readonly searchHashtagsUC: SearchHashtagsUseCase,
    private readonly searchCache: ISearchCacheService,
  ) {}

  async execute(dto: FederatedSearchDTO) {
    const { query, viewerId, limit = 5 } = dto;

    if (!query || query.trim().length === 0) {
      throw new Response.BadRequestError("Search query is required");
    }

    // Check cache
    const cacheKey = this.searchCache.buildCacheKey("federated", query, {
      viewerId,
      limit,
    });

    const cached = await this.searchCache.getCachedResults(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    // Chạy song song 3 searches
    const [usersResult, postsResult, hashtagsResult] = await Promise.allSettled([
      this.searchUsersUC.execute({
        query,
        viewerId,
        limit,
      }),
      this.searchPostsUC.execute({
        query,
        viewerId,
        limit,
      }),
      this.searchHashtagsUC.execute({
        query,
        limit,
      }),
    ]);

    const timing = Date.now() - startTime;

    // Extract results, fallback to empty on failure
    const users =
      usersResult.status === "fulfilled" ? usersResult.value.users : [];
    const posts =
      postsResult.status === "fulfilled" ? postsResult.value.posts : [];
    const hashtags =
      hashtagsResult.status === "fulfilled"
        ? hashtagsResult.value.hashtags
        : [];

    const totalResults =
      users.length + posts.length + hashtags.length;

    const response = {
      users,
      posts,
      hashtags,
      meta: {
        totalResults,
        timing: `${timing}ms`,
        sources: {
          users: usersResult.status === "fulfilled" ? "ok" : "error",
          posts: postsResult.status === "fulfilled" ? "ok" : "error",
          hashtags: hashtagsResult.status === "fulfilled" ? "ok" : "error",
        },
      },
    };

    // Cache for 2 minutes
    await this.searchCache.setCachedResults(cacheKey, response, "FEDERATED");

    return response;
  }
}
