import { SearchHistoryEntity } from "./search.entity";
import { ESearchType } from "./search.type";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface ISearchHistoryRepository {
  /**
   * Upsert search entry with dedup logic:
   * - Nếu cùng keyword đã được search trong 1 giờ → update timestamp + resultCount
   * - Nếu không → tạo mới
   * - Sau khi tạo mới → enforce cap (max 30 entries/user)
   */
  upsertSearch(
    userId: string,
    keyword: string,
    searchType: ESearchType,
    resultCount: number,
  ): Promise<SearchHistoryEntity>;

  /**
   * Lấy search history gần đây (chưa bị xóa)
   * Sorted by updatedAt desc
   */
  findRecentByUser(userId: string, limit: number): Promise<SearchHistoryEntity[]>;

  /**
   * Soft delete 1 entry
   */
  softDelete(userId: string, searchId: string): Promise<void>;

  /**
   * Soft delete tất cả entries của user
   */
  softDeleteAll(userId: string): Promise<void>;

  /**
   * Tìm search history theo prefix (cho autocomplete)
   */
  findByPrefix(userId: string, prefix: string, limit: number): Promise<SearchHistoryEntity[]>;

  /**
   * Đếm số entries chưa bị xóa của user
   */
  countByUser(userId: string): Promise<number>;

  /**
   * Giữ lại `keepCount` entries mới nhất, xóa phần còn lại (hard delete)
   * Dùng để enforce cap 30 entries/user
   */
  deleteOldest(userId: string, keepCount: number): Promise<void>;
}
