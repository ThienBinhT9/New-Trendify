import { GetAutocompleteDTO } from "@/application/dtos/search.dto";
import { ISearchHistoryRepository } from "@/domain/search";
import { IUserRepository } from "@/domain/user";
import { ICacheService } from "@/application/services";

// ============================================================================
// AUTOCOMPLETE SUGGESTION TYPES
// ============================================================================

export interface AutocompleteSuggestion {
  text: string;
  source: "history" | "trending" | "username";
}

// ============================================================================
// GET AUTOCOMPLETE USE CASE
// ============================================================================

export class GetAutocompleteUseCase {
  constructor(
    private readonly searchHistoryRepo: ISearchHistoryRepository,
    private readonly userRepo: IUserRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(dto: GetAutocompleteDTO) {
    const { userId, query, limit = 8 } = dto;

    if (!query || query.trim().length === 0) {
      return { suggestions: [] };
    }

    const trimmedQuery = query.trim().toLowerCase();
    const suggestions: AutocompleteSuggestion[] = [];
    const seen = new Set<string>();

    // Source 1: User's search history (prefix match)
    const historyEntries = await this.searchHistoryRepo.findByPrefix(
      userId,
      trimmedQuery,
      5,
    );

    for (const entry of historyEntries) {
      const text = entry.keyword;
      if (!seen.has(text)) {
        seen.add(text);
        suggestions.push({ text, source: "history" });
      }
    }

    // Source 2: Trending keywords (từ Redis sorted set)
    try {
      const trendingData = await this.cacheService.get<string[]>("search:trending:keywords");
      if (trendingData) {
        const matchingTrending = trendingData
          .filter((kw) => kw.toLowerCase().startsWith(trimmedQuery))
          .slice(0, 3);

        for (const text of matchingTrending) {
          const normalized = text.toLowerCase();
          if (!seen.has(normalized)) {
            seen.add(normalized);
            suggestions.push({ text: normalized, source: "trending" });
          }
        }
      }
    } catch {
      // Redis failure: skip trending suggestions
    }

    // Source 3: Username prefix match
    if (suggestions.length < limit) {
      const remaining = limit - suggestions.length;
      const { users } = await this.userRepo.searchUsers(trimmedQuery, {
        limit: remaining,
      });

      for (const user of users) {
        const text = user.data.username;
        if (!seen.has(text)) {
          seen.add(text);
          suggestions.push({ text, source: "username" });
        }
      }
    }

    return {
      suggestions: suggestions.slice(0, limit),
    };
  }
}
