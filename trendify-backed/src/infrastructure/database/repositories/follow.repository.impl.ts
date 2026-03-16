import { EFollowStatus, FollowEntity, IFollowProps, IFollowRepository } from "@/domain/follow";
import { FollowModel } from "../models";
import { ClientSession, Types } from "mongoose";
import { BaseRepository } from "./base.repository";
import { UserModel } from "../models";

export class MongooseFollowRepository
  extends BaseRepository<FollowEntity, IFollowProps>
  implements IFollowRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(follow: FollowEntity): Promise<FollowEntity | null> {
    try {
      const [doc] = await FollowModel.create([follow.data], { session: this.session });
      return this.mapToEntity(doc.toObject(), FollowEntity);
    } catch (error: any) {
      if (error.code === 11000) {
        return null; // Duplicate key - relationship already exists
      }
      throw error;
    }
  }

  async save(follow: FollowEntity): Promise<FollowEntity> {
    const doc = await FollowModel.findByIdAndUpdate(
      follow.id,
      { $set: { status: follow.status, updatedAt: follow.data.updatedAt } },
      { new: true, session: this.session },
    );

    if (!doc) {
      throw new Error("Follow not found");
    }

    return this.mapToEntity(doc.toObject(), FollowEntity)!;
  }

  async findByPair(
    followerId: string,
    followingId: string,
    status?: EFollowStatus,
  ): Promise<FollowEntity | null> {
    const query: Record<string, unknown> = {
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    };

    if (status) {
      query.status = status;
    }

    const doc = await FollowModel.findOne(query).lean();
    if (!doc) return null;

    return this.mapToEntity(doc, FollowEntity);
  }

  async exists(followerId: string, followingId: string): Promise<boolean> {
    return FollowModel.exists({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
      status: EFollowStatus.ACCEPTED,
    }).then(Boolean);
  }

  async hasPendingRequest(followerId: string, followingId: string): Promise<boolean> {
    return FollowModel.exists({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
      status: EFollowStatus.PENDING,
    }).then(Boolean);
  }

  async getRelationship(
    viewerId: string,
    targetId: string,
  ): Promise<{
    isFollowing: boolean;
    isFollowedBy: boolean;
    isRequested: boolean;
    isRequestedByThem: boolean;
  }> {
    const viewerOId = new Types.ObjectId(viewerId);
    const targetOId = new Types.ObjectId(targetId);

    // Single aggregation query to get all relationship data
    const result = await FollowModel.aggregate([
      {
        $match: {
          $or: [
            { followerId: viewerOId, followingId: targetOId },
            { followerId: targetOId, followingId: viewerOId },
          ],
        },
      },
      {
        $group: {
          _id: null,
          relationships: {
            $push: { followerId: "$followerId", followingId: "$followingId", status: "$status" },
          },
        },
      },
    ]);

    if (!result.length || !result[0].relationships) {
      return {
        isFollowing: false,
        isFollowedBy: false,
        isRequested: false,
        isRequestedByThem: false,
      };
    }

    const relationships = result[0].relationships;

    const isFollowing = relationships.some(
      (r: any) =>
        r.followerId.equals(viewerOId) &&
        r.followingId.equals(targetOId) &&
        r.status === EFollowStatus.ACCEPTED,
    );

    const isFollowedBy = relationships.some(
      (r: any) =>
        r.followerId.equals(targetOId) &&
        r.followingId.equals(viewerOId) &&
        r.status === EFollowStatus.ACCEPTED,
    );

    const isRequested = relationships.some(
      (r: any) =>
        r.followerId.equals(viewerOId) &&
        r.followingId.equals(targetOId) &&
        r.status === EFollowStatus.PENDING,
    );

    const isRequestedByThem = relationships.some(
      (r: any) =>
        r.followerId.equals(targetOId) &&
        r.followingId.equals(viewerOId) &&
        r.status === EFollowStatus.PENDING,
    );

    return { isFollowing, isFollowedBy, isRequested, isRequestedByThem };
  }

  async deleteFollow(followerId: string, followingId: string): Promise<boolean> {
    const res = await FollowModel.deleteOne(
      {
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
        status: EFollowStatus.ACCEPTED,
      },
      { session: this.session },
    );

    return res.deletedCount === 1;
  }

  async deleteRequest(followerId: string, followingId: string): Promise<boolean> {
    const res = await FollowModel.deleteOne(
      {
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
        status: EFollowStatus.PENDING,
      },
      { session: this.session },
    );

    return res.deletedCount === 1;
  }

  async findFollowers(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ userIds: string[]; nextCursor?: string }> {
    const query: Record<string, unknown> = {
      followingId: new Types.ObjectId(userId),
      status: EFollowStatus.ACCEPTED,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await FollowModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .select({ followerId: 1 })
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      userIds: sliced.map((d) => d.followerId.toString()),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findFollowing(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ userIds: string[]; nextCursor?: string }> {
    const query: Record<string, unknown> = {
      followerId: new Types.ObjectId(userId),
      status: EFollowStatus.ACCEPTED,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await FollowModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .select({ followingId: 1 })
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      userIds: sliced.map((d) => d.followingId.toString()),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async searchFollowers(
    userId: string,
    query: string,
    limit: number,
    page: number,
  ): Promise<{ userIds: string[]; hasNext: boolean }> {
    const skip = (page - 1) * limit;
    const userIdObj = new Types.ObjectId(userId);

    // Start from User collection leveraging the text index, then lookup follow relationship
    const docs = await UserModel.aggregate([
      {
        $match: { $text: { $search: query } },
      },
      { $sort: { score: { $meta: "textScore" }, _id: -1 } },
      {
        $lookup: {
          from: FollowModel.collection.name,
          let: { candidateId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followerId", "$$candidateId"] },
                    { $eq: ["$followingId", userIdObj] },
                    { $eq: ["$status", EFollowStatus.ACCEPTED] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "follow",
        },
      },
      { $match: { "follow.0": { $exists: true } } },
      { $skip: skip },
      { $limit: limit + 1 },
      { $project: { _id: 1 } },
    ]);

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      userIds: sliced.map((d) => d._id.toString()),
      hasNext,
    };
  }

  async searchFollowing(
    userId: string,
    query: string,
    limit: number,
    page: number,
  ): Promise<{ userIds: string[]; hasNext: boolean }> {
    const skip = (page - 1) * limit;
    const userIdObj = new Types.ObjectId(userId);

    const docs = await UserModel.aggregate([
      {
        $match: { $text: { $search: query } },
      },
      {
        $addFields: { score: { $meta: "textScore" } },
      },
      {
        $sort: { score: -1, _id: -1 },
      },
      {
        $lookup: {
          from: FollowModel.collection.name,
          let: { candidateId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followerId", userIdObj] },
                    { $eq: ["$followingId", "$$candidateId"] },
                    { $eq: ["$status", EFollowStatus.ACCEPTED] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "follow",
        },
      },
      { $match: { "follow.0": { $exists: true } } },
      { $skip: skip },
      { $limit: limit + 1 },
      { $project: { _id: 1 } },
    ]);

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      userIds: sliced.map((d) => d._id.toString()),
      hasNext,
    };
  }

  async findPendingRequestsTo(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ follows: FollowEntity[]; nextCursor?: string }> {
    const query: Record<string, unknown> = {
      followingId: new Types.ObjectId(userId),
      status: EFollowStatus.PENDING,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await FollowModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      follows: sliced.map((d) => this.mapToEntity(d, FollowEntity)!),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findPendingRequestsFrom(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ follows: FollowEntity[]; nextCursor?: string }> {
    const query: Record<string, unknown> = {
      followerId: new Types.ObjectId(userId),
      status: EFollowStatus.PENDING,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await FollowModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      follows: sliced.map((d) => this.mapToEntity(d, FollowEntity)!),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findFollowingIds(viewerId: string, targetUserIds: string[]): Promise<Set<string>> {
    if (targetUserIds.length === 0) return new Set();

    const docs = await FollowModel.find({
      followerId: new Types.ObjectId(viewerId),
      followingId: { $in: targetUserIds.map((id) => new Types.ObjectId(id)) },
      status: EFollowStatus.ACCEPTED,
    })
      .select({ followingId: 1 })
      .lean();

    return new Set(docs.map((d) => d.followingId.toString()));
  }

  async findAllFollowingIds(userId: string): Promise<string[]> {
    const docs = await FollowModel.find({
      followerId: new Types.ObjectId(userId),
      status: EFollowStatus.ACCEPTED,
    })
      .select({ followingId: 1 })
      .lean();

    return docs.map((d) => d.followingId.toString());
  }

  async findFollowedIds(viewerId: string, targetUserIds: string[]): Promise<Set<string>> {
    if (targetUserIds.length === 0) return new Set();

    const docs = await FollowModel.find({
      followingId: new Types.ObjectId(viewerId),
      followerId: { $in: targetUserIds.map((id) => new Types.ObjectId(id)) },
      status: EFollowStatus.ACCEPTED,
    })
      .select({ followerId: 1 })
      .lean();

    return new Set(docs.map((d) => d.followerId.toString()));
  }

  async findPendingRequestIds(viewerId: string, targetUserIds: string[]): Promise<Set<string>> {
    if (targetUserIds.length === 0) return new Set();

    const docs = await FollowModel.find({
      followerId: new Types.ObjectId(viewerId),
      followingId: { $in: targetUserIds.map((id) => new Types.ObjectId(id)) },
      status: EFollowStatus.PENDING,
    })
      .select({ followingId: 1 })
      .lean();

    return new Set(docs.map((d) => d.followingId.toString()));
  }

  async findUserFollowData(
    viewerId: string,
    targetUserIds: string[],
  ): Promise<{ followingIds: Set<string>; pendingRequestIds: Set<string> }> {
    if (targetUserIds.length === 0) {
      return { followingIds: new Set(), pendingRequestIds: new Set() };
    }

    // Single query to get both ACCEPTED and PENDING follows from viewer to targets
    const docs = await FollowModel.find({
      followerId: new Types.ObjectId(viewerId),
      followingId: { $in: targetUserIds.map((id) => new Types.ObjectId(id)) },
      status: { $in: [EFollowStatus.ACCEPTED, EFollowStatus.PENDING] },
    })
      .select({ followingId: 1, status: 1 })
      .lean();

    const followingIds = new Set<string>();
    const pendingRequestIds = new Set<string>();

    docs.forEach((doc) => {
      const id = doc.followingId.toString();
      if (doc.status === EFollowStatus.ACCEPTED) {
        followingIds.add(id);
      } else if (doc.status === EFollowStatus.PENDING) {
        pendingRequestIds.add(id);
      }
    });

    return { followingIds, pendingRequestIds };
  }

  async deleteByPairs(pairs: Array<{ followerId: string; followingId: string }>): Promise<number> {
    if (pairs.length === 0) return 0;

    const result = await FollowModel.deleteMany(
      {
        $or: pairs.map((p) => ({
          followerId: new Types.ObjectId(p.followerId),
          followingId: new Types.ObjectId(p.followingId),
        })),
      },
      { session: this.session },
    );

    return result.deletedCount;
  }
}
