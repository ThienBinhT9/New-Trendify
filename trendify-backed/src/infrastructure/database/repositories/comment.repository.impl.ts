import { ClientSession, Types } from "mongoose";

import {
  ICommentRepository,
  CommentEntity,
  ICommentProps,
  ECommentStatus,
  FindCommentsOptions,
  FindCommentRepliesOptions,
  FindCommentsResult,
} from "@/domain/comment";
import { CommentModel } from "../models/comment.model";
import { BaseRepository } from "./base.repository";

export class MongooseCommentRepository
  extends BaseRepository<CommentEntity, ICommentProps>
  implements ICommentRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(comment: CommentEntity): Promise<CommentEntity> {
    const data = comment.data;
    const [doc] = await CommentModel.create(
      [
        {
          ...data,
          postId: new Types.ObjectId(data.postId),
          authorId: new Types.ObjectId(data.authorId),
          parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
          rootCommentId: data.rootCommentId ? new Types.ObjectId(data.rootCommentId) : null,
        },
      ],
      { session: this.session },
    );
    return this.mapToEntity(doc.toObject(), CommentEntity);
  }

  async save(comment: CommentEntity): Promise<void> {
    await CommentModel.findByIdAndUpdate(
      comment.id,
      { $set: comment.data },
      { session: this.session },
    );
  }

  async findById(commentId: string): Promise<CommentEntity | null> {
    try {
      const doc = await CommentModel.findById(commentId).lean();
      if (!doc) return null;
      return this.mapToEntity(doc, CommentEntity);
    } catch {
      return null;
    }
  }

  async findByPost(options: FindCommentsOptions): Promise<FindCommentsResult> {
    const { postId, limit, cursor } = options;

    const query: any = {
      postId: new Types.ObjectId(postId),
      parentId: null,
      status: ECommentStatus.ACTIVE,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await CommentModel.find(query)
      .sort({ _id: -1 }) // Newest first
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      comments: sliced.map((doc) => this.mapToEntity(doc, CommentEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findReplies(options: FindCommentRepliesOptions): Promise<FindCommentsResult> {
    const { parentId, limit, cursor } = options;

    const query: any = {
      parentId: new Types.ObjectId(parentId),
      status: ECommentStatus.ACTIVE,
    };

    // Replies in chronological order (oldest first)
    if (cursor) {
      query._id = { $gt: new Types.ObjectId(cursor) };
    }

    const docs = await CommentModel.find(query)
      .sort({ _id: 1 }) // Chronological
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      comments: sliced.map((doc) => this.mapToEntity(doc, CommentEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async countByPost(postId: string): Promise<number> {
    return CommentModel.countDocuments({
      postId: new Types.ObjectId(postId),
      status: ECommentStatus.ACTIVE,
    });
  }

  async incrementReplyCount(commentId: string, by: number = 1): Promise<void> {
    await CommentModel.updateOne(
      { _id: new Types.ObjectId(commentId) },
      { $inc: { replyCount: by } },
      { session: this.session },
    );
  }

  async deleteByPost(postId: string): Promise<number> {
    const result = await CommentModel.deleteMany({ postId: new Types.ObjectId(postId) });
    return result.deletedCount;
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: any,
    EntityClass: new (props: ICommentProps, id?: string) => CommentEntity,
  ): CommentEntity {
    if (!doc) throw new Error("Document not found");

    const { _id, __v, postId, authorId, parentId, rootCommentId, createdAt, updatedAt, ...rest } =
      doc;

    const props: ICommentProps = {
      ...rest,
      postId: postId.toString(),
      authorId: authorId.toString(),
      parentId: parentId?.toString() ?? undefined,
      rootCommentId: rootCommentId?.toString() ?? undefined,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }
}
