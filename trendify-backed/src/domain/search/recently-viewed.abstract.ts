import { EViewedResourceType, IRecentlyViewedProps } from "./recently-viewed.type";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface IRecentlyViewedRepository {
  /**
   * Upsert view: update viewedAt nếu đã tồn tại, tạo mới nếu chưa
   * Enforce cap: tối đa 50 entries/user
   */
  upsertView(userId: string, resourceId: string, resourceType: EViewedResourceType): Promise<void>;

  /**
   * Lấy recently viewed items, sorted by viewedAt desc
   */
  findRecentByUser(
    userId: string,
    limit: number,
    resourceType?: EViewedResourceType,
  ): Promise<IRecentlyViewedProps[]>;

  /**
   * Xóa tất cả recently viewed của user
   */
  deleteByUser(userId: string): Promise<void>;

  /**
   * Xóa 1 entry cụ thể
   */
  deleteByResource(userId: string, resourceId: string): Promise<void>;
}
