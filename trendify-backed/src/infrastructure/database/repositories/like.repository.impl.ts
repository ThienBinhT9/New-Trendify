import { ClientSession, Types } from "mongoose";

import { ILikeRepository, LikeEntity, ILikeProps } from "@/domain/like";
import { LikeModel } from "../models/like.model";
import { BaseRepository } from "./base.repository";

export class MongooseLikeRepository
  extends BaseRepository<LikeEntity, ILikeProps>
  implements ILikeRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(like: LikeEntity): Promise<LikeEntity | null> {
    try {
      const doc = await LikeModel.create({
        userId: new Types.ObjectId(like.userId),
        postId: new Types.ObjectId(like.postId),
      });
      return this.mapToEntity(doc.toObject(), LikeEntity);
    } catch (error: any) {
      // Duplicate key error = already liked
      if (error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async delete(userId: string, postId: string): Promise<boolean> {
    const result = await LikeModel.deleteOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });
    return result.deletedCount === 1;
  }

  async exists(userId: string, postId: string): Promise<boolean> {
    const doc = await LikeModel.exists({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });
    return !!doc;
  }

  async findByPost(
    postId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ likes: LikeEntity[]; nextCursor?: string }> {
    const query: any = { postId: new Types.ObjectId(postId) };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await LikeModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      likes: sliced.map((doc) => this.mapToEntity(doc, LikeEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();

    const docs = await LikeModel.find({
      userId: new Types.ObjectId(userId),
      postId: { $in: postIds.map((id) => new Types.ObjectId(id)) },
    })
      .select({ postId: 1 })
      .lean();

    return new Set(docs.map((d) => d.postId.toString()));
  }

  async countByPost(postId: string): Promise<number> {
    return LikeModel.countDocuments({ postId: new Types.ObjectId(postId) });
  }

  async deleteByPost(postId: string): Promise<number> {
    const result = await LikeModel.deleteMany({ postId: new Types.ObjectId(postId) });
    return result.deletedCount;
  }

  protected override mapToEntity(
    doc: any,
    EntityClass: new (props: ILikeProps, id?: string) => LikeEntity,
  ): LikeEntity {
    if (!doc) throw new Error("Document not found");

    const { _id, userId, postId, createdAt } = doc;

    return new EntityClass(
      {
        userId: userId.toString(),
        postId: postId.toString(),
        createdAt: new Date(createdAt),
      },
      _id.toString(),
    );
  }
}
