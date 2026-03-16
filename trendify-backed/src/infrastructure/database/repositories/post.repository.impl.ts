import { ClientSession, Types } from "mongoose";

import {
  IPostRepository,
  PostEntity,
  IPostProps,
  EPostStatus,
  FindUserPostsOptions,
  FindUserPostsResult,
  FindRepliesOptions,
  FindByHashtagOptions,
  FindFeedOptions,
} from "@/domain/post";
import { PostModel } from "../models/post.model";
import { BaseRepository } from "./base.repository";

export class MongoosePostRepository
  extends BaseRepository<PostEntity, IPostProps>
  implements IPostRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  // ====================== CRUD OPERATIONS ======================

  async create(post: PostEntity): Promise<PostEntity | null> {
    try {
      const postData = post.data;
      const data = {
        ...postData,
        authorId: new Types.ObjectId(postData.authorId),
        mediaIds: postData.mediaIds.map((id) => new Types.ObjectId(id)),
        replyToId: postData.replyToId ? new Types.ObjectId(postData.replyToId) : undefined,
        rootPostId: postData.rootPostId ? new Types.ObjectId(postData.rootPostId) : undefined,
      };
      const [doc] = await PostModel.create([data], { session: this.session });
      return this.mapToEntity(doc.toObject(), PostEntity);
    } catch (error: any) {
      if (error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async update(post: PostEntity): Promise<PostEntity | null> {
    const doc = await PostModel.findByIdAndUpdate(
      post.id,
      { $set: post.data },
      { new: true, session: this.session },
    ).lean();

    if (!doc) return null;
    return this.mapToEntity(doc, PostEntity);
  }

  async save(post: PostEntity): Promise<void> {
    await PostModel.findByIdAndUpdate(post.id, { $set: post.data }, { session: this.session });
  }

  async delete(postId: string): Promise<void> {
    await PostModel.findByIdAndDelete(postId, { session: this.session });
  }

  // ====================== QUERY OPERATIONS ======================

  async findById(postId: string): Promise<PostEntity | null> {
    try {
      const doc = await PostModel.findById(postId).lean();
      if (!doc) return null;
      return this.mapToEntity(doc, PostEntity);
    } catch {
      return null;
    }
  }

  async findManyByIds(ids: string[]): Promise<PostEntity[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const docs = await PostModel.find({ _id: { $in: objectIds } }).lean();

    return docs.map((doc) => this.mapToEntity(doc, PostEntity));
  }

  async findByUser(options: FindUserPostsOptions): Promise<FindUserPostsResult> {
    const { authorId, statuses, visibilities, limit, cursor, type, pinnedFirst } = options;

    const query: any = {
      authorId: new Types.ObjectId(authorId),
      status: { $in: statuses },
      "settings.visibility": { $in: visibilities },
    };

    // Filter by post type
    if (type) {
      query.type = type;
    }

    // Cursor-based pagination using _id (ObjectId is time-ordered)
    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // If pinnedFirst, we need to sort by isPinned first
    const sort: any = pinnedFirst ? { isPinned: -1, _id: -1 } : { _id: -1 };

    const docs = await PostModel.find(query)
      .sort(sort)
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    const posts = sliced.map((doc) => this.mapToEntity(doc, PostEntity));
    const nextCursor = hasNext ? sliced[sliced.length - 1]._id.toString() : undefined;

    return { posts, nextCursor };
  }

  // ====================== REPLY/THREAD QUERIES ======================

  async findReplies(options: FindRepliesOptions): Promise<FindUserPostsResult> {
    const { postId, limit, cursor } = options;

    const query: any = {
      replyToId: new Types.ObjectId(postId),
      status: EPostStatus.ACTIVE,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await PostModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    const posts = sliced.map((doc) => this.mapToEntity(doc, PostEntity));
    const nextCursor = hasNext ? sliced[sliced.length - 1]._id.toString() : undefined;

    return { posts, nextCursor };
  }

  async countReplies(postId: string): Promise<number> {
    return PostModel.countDocuments({
      replyToId: new Types.ObjectId(postId),
      status: EPostStatus.ACTIVE,
    });
  }

  // ====================== HASHTAG QUERIES ======================

  async findByHashtag(options: FindByHashtagOptions): Promise<FindUserPostsResult> {
    const { hashtag, limit, cursor } = options;

    const normalizedHashtag = hashtag.toLowerCase().replace(/^#/, "");

    const query: any = {
      hashtags: normalizedHashtag,
      status: EPostStatus.ACTIVE,
      "settings.visibility": "public",
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await PostModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    const posts = sliced.map((doc) => this.mapToEntity(doc, PostEntity));
    const nextCursor = hasNext ? sliced[sliced.length - 1]._id.toString() : undefined;

    return { posts, nextCursor };
  }

  // ====================== PINNED POSTS ======================

  async findPinnedByUser(authorId: string): Promise<PostEntity[]> {
    const docs = await PostModel.find({
      authorId: new Types.ObjectId(authorId),
      isPinned: true,
      status: EPostStatus.ACTIVE,
    })
      .sort({ _id: -1 })
      .limit(3) // Max 3 pinned posts
      .lean();

    return docs.map((doc) => this.mapToEntity(doc, PostEntity));
  }

  // ====================== FEED QUERY ======================

  async findFeed(options: FindFeedOptions): Promise<FindUserPostsResult> {
    const { authorIds, limit, cursor } = options;

    if (authorIds.length === 0) return { posts: [] };

    const query: any = {
      authorId: { $in: authorIds.map((id) => new Types.ObjectId(id)) },
      status: EPostStatus.ACTIVE,
      "settings.visibility": { $in: ["public", "follower"] },
      replyToId: { $exists: false }, // Exclude replies/comments from feed
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await PostModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    const posts = sliced.map((doc) => this.mapToEntity(doc, PostEntity));
    const nextCursor = hasNext ? sliced[sliced.length - 1]._id.toString() : undefined;

    return { posts, nextCursor };
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: any,
    EntityClass: new (props: IPostProps, id?: string) => PostEntity,
  ): PostEntity {
    if (!doc) throw new Error("Document not found");

    const { _id, __v, authorId, replyToId, rootPostId, mediaIds, createdAt, updatedAt, ...rest } =
      doc;

    const props: IPostProps = {
      ...rest,
      authorId: authorId.toString(),
      replyToId: replyToId?.toString(),
      rootPostId: rootPostId?.toString(),
      mediaIds: (mediaIds ?? []).map((id: any) => id.toString()),
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }

  // ====================== COUNTER OPERATIONS ======================

  async incrementLikeCount(postId: string, by: number = 1): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { "counters.likeCount": by } },
      { session: this.session },
    );
  }

  async incrementCommentCount(postId: string, by: number = 1): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { "counters.commentCount": by } },
      { session: this.session },
    );
  }

  async incrementShareCount(postId: string, by: number = 1): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { "counters.shareCount": by } },
      { session: this.session },
    );
  }

  async incrementViewCount(postId: string, by: number = 1): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { "counters.viewCount": by } },
      { session: this.session },
    );
  }

  async incrementRepostCount(postId: string, by: number = 1): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { "counters.repostCount": by } },
      { session: this.session },
    );
  }

  async incrementSaveCount(postId: string, by: number = 1): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { "counters.saveCount": by } },
      { session: this.session },
    );
  }

  async setLikeCount(postId: string, count: number): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $set: { "counters.likeCount": count } },
      { session: this.session },
    );
  }

  async setViewCount(postId: string, count: number): Promise<void> {
    await PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $set: { "counters.viewCount": count } },
      { session: this.session },
    );
  }
}
