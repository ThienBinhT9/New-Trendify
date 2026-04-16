import { Types } from "mongoose";

import { ICommentLikeRepository } from "@/domain/comment-like";
import { CommentLikeModel } from "../models/comment-like.model";

export class MongooseCommentLikeRepository implements ICommentLikeRepository {
  async create(userId: string, commentId: string): Promise<boolean> {
    try {
      await CommentLikeModel.create({
        userId: new Types.ObjectId(userId),
        commentId: new Types.ObjectId(commentId),
      });
      return true;
    } catch (error: any) {
      // Duplicate key error = already liked
      if (error.code === 11000) {
        return false;
      }
      throw error;
    }
  }

  async delete(userId: string, commentId: string): Promise<boolean> {
    const result = await CommentLikeModel.deleteOne({
      userId: new Types.ObjectId(userId),
      commentId: new Types.ObjectId(commentId),
    });
    return result.deletedCount === 1;
  }

  async exists(userId: string, commentId: string): Promise<boolean> {
    const doc = await CommentLikeModel.exists({
      userId: new Types.ObjectId(userId),
      commentId: new Types.ObjectId(commentId),
    });
    return !!doc;
  }

  async findLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>> {
    if (commentIds.length === 0) return new Set();

    const docs = await CommentLikeModel.find({
      userId: new Types.ObjectId(userId),
      commentId: { $in: commentIds.map((id) => new Types.ObjectId(id)) },
    })
      .select({ commentId: 1 })
      .lean();

    return new Set(docs.map((d) => d.commentId.toString()));
  }

  async deleteByComment(commentId: string): Promise<number> {
    const result = await CommentLikeModel.deleteMany({
      commentId: new Types.ObjectId(commentId),
    });
    return result.deletedCount;
  }
}
