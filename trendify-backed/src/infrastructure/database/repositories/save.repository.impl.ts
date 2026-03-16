import { ClientSession, Types } from "mongoose";

import { ISaveRepository, SaveEntity, ISaveProps } from "@/domain/save";
import { SaveModel } from "../models/save.model";
import { BaseRepository } from "./base.repository";

export class MongooseSaveRepository
  extends BaseRepository<SaveEntity, ISaveProps>
  implements ISaveRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(save: SaveEntity): Promise<SaveEntity | null> {
    try {
      const doc = await SaveModel.create({
        userId: new Types.ObjectId(save.userId),
        postId: new Types.ObjectId(save.postId),
      });
      return this.mapToEntity(doc.toObject(), SaveEntity);
    } catch (error: any) {
      // Duplicate key error = already saved
      if (error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async delete(userId: string, postId: string): Promise<boolean> {
    const result = await SaveModel.deleteOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });
    return result.deletedCount === 1;
  }

  async exists(userId: string, postId: string): Promise<boolean> {
    const doc = await SaveModel.exists({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });
    return !!doc;
  }

  async findByUser(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ saves: SaveEntity[]; nextCursor?: string }> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await SaveModel.find(query)
      .sort({ _id: -1 }) // Newest first
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      saves: sliced.map((doc) => this.mapToEntity(doc, SaveEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findSavedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();

    const docs = await SaveModel.find({
      userId: new Types.ObjectId(userId),
      postId: { $in: postIds.map((id) => new Types.ObjectId(id)) },
    })
      .select({ postId: 1 })
      .lean();

    return new Set(docs.map((d) => d.postId.toString()));
  }

  async countByUser(userId: string): Promise<number> {
    return SaveModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
  }

  async deleteByPost(postId: string): Promise<number> {
    const result = await SaveModel.deleteMany({ postId: new Types.ObjectId(postId) });
    return result.deletedCount;
  }
}
