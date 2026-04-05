import { DeleteSearchHistoryDTO } from "@/application/dtos/search.dto";
import { ISearchHistoryRepository } from "@/domain/search";

// ============================================================================
// DELETE SEARCH HISTORY USE CASE
// ============================================================================

export class DeleteSearchHistoryUseCase {
  constructor(
    private readonly searchHistoryRepo: ISearchHistoryRepository,
  ) {}

  /**
   * Soft delete search history entries
   * - Nếu truyền searchId → xóa 1 entry
   * - Nếu không truyền → xóa tất cả entries của user
   */
  async execute(dto: DeleteSearchHistoryDTO): Promise<void> {
    const { userId, searchId } = dto;

    if (searchId) {
      await this.searchHistoryRepo.softDelete(userId, searchId);
    } else {
      await this.searchHistoryRepo.softDeleteAll(userId);
    }
  }
}
