import { Types } from "mongoose";

import {
  SearchHistoryEntity,
  ISearchHistoryProps,
  ISearchHistoryRepository,
  ESearchType,
} from "@/domain/search";
import { BaseRepository } from "./base.repository";
import { SearchHistoryModel } from "../models/search-history.model";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Dedup window: nếu cùng keyword trong 1 giờ → chỉ update timestamp */
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Tối đa 30 entries/user */
const MAX_ENTRIES_PER_USER = 30;

// ============================================================================
// REPOSITORY
// ============================================================================

export class MongooseSearchHistoryRepository
  extends BaseRepository<SearchHistoryEntity, ISearchHistoryProps>
  implements ISearchHistoryRepository
{
  // --------------------------------------------------------------------------
  // Upsert with dedup + cap enforcement
  // --------------------------------------------------------------------------

  async upsertSearch(
    userId: string,
    keyword: string,
    searchType: ESearchType,
    resultCount: number,
  ): Promise<SearchHistoryEntity> {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_MS);

    // Dedup: tìm entry cùng keyword trong 1 giờ qua
    const existing = await SearchHistoryModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        keyword: normalizedKeyword,
        deletedAt: null,
        updatedAt: { $gte: dedupCutoff },
      },
      {
        $set: {
          resultCount,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).lean();

    if (existing) {
      return this.mapToEntity(existing, SearchHistoryEntity);
    }

    // Không có entry trùng trong 1 giờ → tạo mới
    const doc = await SearchHistoryModel.create({
      userId: new Types.ObjectId(userId),
      keyword: normalizedKeyword,
      searchType,
      resultCount,
      deletedAt: null,
    });

    // Enforce cap: giữ tối đa MAX_ENTRIES_PER_USER entries
    await this.deleteOldest(userId, MAX_ENTRIES_PER_USER);

    return this.mapToEntity(doc.toObject(), SearchHistoryEntity);
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  async findRecentByUser(userId: string, limit: number): Promise<SearchHistoryEntity[]> {
    const docs = await SearchHistoryModel.find({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => this.mapToEntity(doc, SearchHistoryEntity));
  }

  async findByPrefix(
    userId: string,
    prefix: string,
    limit: number,
  ): Promise<SearchHistoryEntity[]> {
    const normalizedPrefix = prefix.toLowerCase().trim();

    // Escape regex special characters
    const escapedPrefix = normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const docs = await SearchHistoryModel.find({
      userId: new Types.ObjectId(userId),
      keyword: { $regex: `^${escapedPrefix}`, $options: "i" },
      deletedAt: null,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => this.mapToEntity(doc, SearchHistoryEntity));
  }

  async countByUser(userId: string): Promise<number> {
    return SearchHistoryModel.countDocuments({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    });
  }

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  async softDelete(userId: string, searchId: string): Promise<void> {
    await SearchHistoryModel.updateOne(
      {
        _id: new Types.ObjectId(searchId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { deletedAt: new Date() } },
    );
  }

  async softDeleteAll(userId: string): Promise<void> {
    await SearchHistoryModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    );
  }

  async deleteOldest(userId: string, keepCount: number): Promise<void> {
    // Tìm entry thứ keepCount (theo updatedAt desc)
    // Mọi entry cũ hơn sẽ bị hard delete
    const cutoffEntry = await SearchHistoryModel.findOne({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    })
      .sort({ updatedAt: -1 })
      .skip(keepCount - 1)
      .select("updatedAt")
      .lean();

    if (!cutoffEntry) return; // Chưa đạt cap

    // Xóa tất cả entries cũ hơn cutoff (không bao gồm cutoff)
    await SearchHistoryModel.deleteMany({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
      updatedAt: { $lt: cutoffEntry.updatedAt },
    });
  }
}
