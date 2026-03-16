import { ClientSession, Types } from "mongoose";
import { IBlockRepository, BlockEntity, IBlockProps } from "@/domain/block";
import { BlockModel } from "../models/block.model";
import { BaseRepository } from "./base.repository";

export class MongooseBlockRepository
  extends BaseRepository<BlockEntity, IBlockProps>
  implements IBlockRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(entity: BlockEntity): Promise<BlockEntity | null> {
    try {
      const data = entity.toSnapshot();
      const [doc] = await BlockModel.create(
        [
          {
            blockerId: new Types.ObjectId(data.blockerId),
            blockedId: new Types.ObjectId(data.blockedId),
            reason: data.reason,
          },
        ],
        { session: this.session },
      );
      return this.mapToEntity(doc.toObject(), BlockEntity);
    } catch (error: any) {
      if (error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async delete(blockerId: string, blockedId: string): Promise<boolean> {
    const result = await BlockModel.deleteOne(
      {
        blockerId: new Types.ObjectId(blockerId),
        blockedId: new Types.ObjectId(blockedId),
      },
      { session: this.session },
    );
    return result.deletedCount > 0;
  }

  async findByPair(blockerId: string, blockedId: string): Promise<BlockEntity | null> {
    const doc = await BlockModel.findOne(
      {
        blockerId: new Types.ObjectId(blockerId),
        blockedId: new Types.ObjectId(blockedId),
      },
      null,
      { session: this.session },
    );
    return doc ? this.mapToEntity(doc.toObject(), BlockEntity) : null;
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const count = await BlockModel.countDocuments(
      {
        blockerId: new Types.ObjectId(blockerId),
        blockedId: new Types.ObjectId(blockedId),
      },
      { session: this.session },
    );
    return count > 0;
  }

  async isEitherBlocked(userIdA: string, userIdB: string): Promise<boolean> {
    const count = await BlockModel.countDocuments(
      {
        $or: [
          { blockerId: new Types.ObjectId(userIdA), blockedId: new Types.ObjectId(userIdB) },
          { blockerId: new Types.ObjectId(userIdB), blockedId: new Types.ObjectId(userIdA) },
        ],
      },
      { session: this.session },
    );
    return count > 0;
  }

  async findBlockedByUser(blockerId: string, options: { limit: number; cursor?: string }) {
    const { limit, cursor } = options;

    const query: Record<string, unknown> = {
      blockerId: new Types.ObjectId(blockerId),
    };

    // Cursor-based pagination
    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await BlockModel.find(query, null, { session: this.session })
      .sort({ _id: -1 }) // Newest first
      .limit(limit + 1) // Fetch one extra to check if there's more
      .lean();

    const hasMore = docs.length > limit;
    const blocks = docs.slice(0, limit).map((doc) =>
      BlockEntity.fromPersistence(
        {
          blockerId: doc.blockerId.toString(),
          blockedId: doc.blockedId.toString(),
          reason: doc.reason,
          createdAt: doc.createdAt,
        },
        doc._id.toString(),
      ),
    );
    const nextCursor = hasMore ? blocks[blocks.length - 1].id : undefined;

    return { blocks, nextCursor };
  }

  async countByBlocker(blockerId: string): Promise<number> {
    return BlockModel.countDocuments(
      {
        blockerId: new Types.ObjectId(blockerId),
      },
      { session: this.session },
    );
  }

  async deleteAllByUser(userId: string): Promise<number> {
    const objectId = new Types.ObjectId(userId);
    const result = await BlockModel.deleteMany(
      {
        $or: [{ blockerId: objectId }, { blockedId: objectId }],
      },
      { session: this.session },
    );
    return result.deletedCount;
  }

  async findBidirectionalBlockedIds(userId: string): Promise<string[]> {
    const objectId = new Types.ObjectId(userId);
    const docs = await BlockModel.find({
      $or: [{ blockerId: objectId }, { blockedId: objectId }],
    })
      .select({ blockerId: 1, blockedId: 1 })
      .lean();

    const ids = new Set<string>();
    for (const doc of docs) {
      const blockerId = doc.blockerId.toString();
      const blockedId = doc.blockedId.toString();
      if (blockerId !== userId) ids.add(blockerId);
      if (blockedId !== userId) ids.add(blockedId);
    }
    return Array.from(ids);
  }
}
