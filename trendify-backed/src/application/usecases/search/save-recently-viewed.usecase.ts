import { SaveRecentlyViewedDTO } from "@/application/dtos/search.dto";
import { IRecentlyViewedRepository } from "@/domain/search";

// ============================================================================
// SAVE RECENTLY VIEWED USE CASE
// ============================================================================

export class SaveRecentlyViewedUseCase {
  constructor(
    private readonly recentlyViewedRepo: IRecentlyViewedRepository,
  ) {}

  /**
   * Lưu recently viewed item khi user click vào search result
   * Upsert: update viewedAt nếu đã tồn tại
   */
  async execute(dto: SaveRecentlyViewedDTO): Promise<void> {
    const { userId, resourceId, resourceType } = dto;

    try {
      await this.recentlyViewedRepo.upsertView(userId, resourceId, resourceType);
    } catch (error) {
      // Fire-and-forget
      console.error("[SaveRecentlyViewed] Error:", error);
    }
  }
}
