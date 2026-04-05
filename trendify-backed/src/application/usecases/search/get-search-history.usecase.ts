import { GetSearchHistoryDTO } from "@/application/dtos/search.dto";
import { ISearchHistoryRepository } from "@/domain/search";

// ============================================================================
// GET SEARCH HISTORY USE CASE
// ============================================================================

export class GetSearchHistoryUseCase {
  constructor(
    private readonly searchHistoryRepo: ISearchHistoryRepository,
  ) {}

  async execute(dto: GetSearchHistoryDTO) {
    const { userId, limit = 10 } = dto;

    const entries = await this.searchHistoryRepo.findRecentByUser(userId, limit);

    return {
      history: entries.map((entry) => ({
        id: entry.id,
        keyword: entry.keyword,
        searchType: entry.searchType,
        resultCount: entry.resultCount,
        searchedAt: entry.updatedAt,
      })),
    };
  }
}
