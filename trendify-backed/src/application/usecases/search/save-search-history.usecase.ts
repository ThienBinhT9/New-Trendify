import { SaveSearchHistoryDTO } from "@/application/dtos/search.dto";
import { ISearchHistoryRepository } from "@/domain/search";

// ============================================================================
// SAVE SEARCH HISTORY USE CASE
// ============================================================================

export class SaveSearchHistoryUseCase {
  constructor(
    private readonly searchHistoryRepo: ISearchHistoryRepository,
  ) {}

  /**
   * Lưu search history (fire-and-forget, không block response)
   * Dedup logic: cùng keyword trong 1 giờ → chỉ update timestamp
   * Cap enforcement: tối đa 30 entries/user
   */
  async execute(dto: SaveSearchHistoryDTO): Promise<void> {
    const { userId, keyword, searchType, resultCount } = dto;

    if (!keyword || keyword.trim().length === 0) return;

    try {
      await this.searchHistoryRepo.upsertSearch(
        userId,
        keyword.trim(),
        searchType,
        resultCount,
      );
    } catch (error) {
      // Fire-and-forget: log error nhưng không throw
      console.error("[SaveSearchHistory] Error:", error);
    }
  }
}
