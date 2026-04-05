import { Types } from "mongoose";

import {
  IRecentlyViewedRepository,
  IRecentlyViewedProps,
  EViewedResourceType,
} from "@/domain/search";
import { RecentlyViewedModel } from "../models/recently-viewed.model";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Tối đa 50 recently viewed entries/user */
const MAX_RECENTLY_VIEWED = 50;

// ============================================================================
// REPOSITORY
// ============================================================================

export class MongooseRecentlyViewedRepository implements IRecentlyViewedRepository {
  async upsertView(
    userId: string,
    resourceId: string,
    resourceType: EViewedResourceType,
  ): Promise<void> {
    // Upsert: update viewedAt nếu đã tồn tại, tạo mới nếu chưa
    await RecentlyViewedModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        resourceId: new Types.ObjectId(resourceId),
        resourceType,
      },
      {
        $set: { viewedAt: new Date() },
      },
      { upsert: true },
    );

    // Enforce cap: giữ tối đa MAX_RECENTLY_VIEWED entries
    const count = await RecentlyViewedModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    if (count > MAX_RECENTLY_VIEWED) {
      // Tìm entry cutoff
      const cutoffEntry = await RecentlyViewedModel.findOne({
        userId: new Types.ObjectId(userId),
      })
        .sort({ viewedAt: -1 })
        .skip(MAX_RECENTLY_VIEWED - 1)
        .select("viewedAt")
        .lean();

      if (cutoffEntry) {
        await RecentlyViewedModel.deleteMany({
          userId: new Types.ObjectId(userId),
          viewedAt: { $lt: cutoffEntry.viewedAt },
        });
      }
    }
  }

  async findRecentByUser(
    userId: string,
    limit: number,
    resourceType?: EViewedResourceType,
  ): Promise<IRecentlyViewedProps[]> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (resourceType) {
      filter.resourceType = resourceType;
    }

    const docs = await RecentlyViewedModel.find(filter)
      .sort({ viewedAt: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => ({
      userId: doc.userId.toString(),
      resourceId: doc.resourceId.toString(),
      resourceType: doc.resourceType,
      viewedAt: doc.viewedAt,
    }));
  }

  async deleteByUser(userId: string): Promise<void> {
    await RecentlyViewedModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  async deleteByResource(userId: string, resourceId: string): Promise<void> {
    await RecentlyViewedModel.deleteOne({
      userId: new Types.ObjectId(userId),
      resourceId: new Types.ObjectId(resourceId),
    });
  }
}
