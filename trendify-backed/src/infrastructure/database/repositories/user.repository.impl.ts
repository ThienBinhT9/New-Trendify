import { ClientSession, Types } from "mongoose";

import { UserEntity, IUserProps, IUserRepository } from "@/domain/user";
import { BaseRepository } from "./base.repository";

import { UserModel } from "../models";

export class MongooseUserRepository
  extends BaseRepository<UserEntity, IUserProps>
  implements IUserRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const doc = await UserModel.findByIdAndUpdate(user.id, user.data, {
      new: true,
      session: this.session,
    });

    if (!doc) throw new Error("Session not found");
    return this.mapToEntity(doc, UserEntity);
  }

  async save(user: UserEntity): Promise<void> {
    await UserModel.updateOne({ _id: user.id }, user.data, {
      session: this.session,
    });
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const [doc] = await UserModel.create([user.data], { session: this.session });

    return this.mapToEntity(doc.toObject(), UserEntity);
  }

  async findByEmail(email: string) {
    const doc = await UserModel.findOne({ email }).lean();
    if (!doc) return null;

    return this.mapToEntity(doc, UserEntity);
  }

  async findById(id: string, options?: { fields?: string[] }) {
    const doc = await UserModel.findById(id)
      .select(options?.fields || [])
      .lean();

    if (!doc) return null;

    return this.mapToEntity(doc, UserEntity);
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ username }).lean();
    if (!doc) return null;

    return this.mapToEntity(doc, UserEntity);
  }

  async deleteById(userId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { isDelete: true }, { session: this.session });
  }

  async existsByEmail(email: string) {
    return UserModel.exists({ email }).then(Boolean);
  }

  async existsByUsername(username: string) {
    return UserModel.exists({ username }).then(Boolean);
  }

  async findByIds(ids: string[], options?: { fields?: string[] }): Promise<UserEntity[]> {
    const docs = await UserModel.find({ _id: { $in: ids } })
      .select(options?.fields || [])
      .lean();

    return docs.map((doc) => this.mapToEntity(doc, UserEntity));
  }

  async incrementPostCount(userId: string, by: number = 1): Promise<void> {
    await UserModel.updateOne(
      { _id: new Types.ObjectId(userId), isDelete: false },
      { $inc: { postCount: by } },
      { session: this.session },
    );
  }

  async incrementFollowerCount(userId: string, by: number = 1): Promise<void> {
    await UserModel.updateOne(
      { _id: new Types.ObjectId(userId), isDelete: false },
      { $inc: { followerCount: by } },
      { session: this.session },
    );
  }

  async incrementFollowingCount(userId: string, by: number = 1): Promise<void> {
    await UserModel.updateOne(
      { _id: new Types.ObjectId(userId), isDelete: false },
      { $inc: { followingCount: by } },
      { session: this.session },
    );
  }

  async batchIncrementCounts(
    operations: Array<{
      userId: string;
      followerDelta?: number;
      followingDelta?: number;
    }>,
  ): Promise<void> {
    if (operations.length === 0) return;

    const bulkOps = operations
      .filter((op) => op.followerDelta || op.followingDelta)
      .map((op) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(op.userId) },
          update: {
            $inc: {
              ...(op.followerDelta && { followerCount: op.followerDelta }),
              ...(op.followingDelta && { followingCount: op.followingDelta }),
            },
          },
        },
      }));

    if (bulkOps.length > 0) {
      await UserModel.bulkWrite(bulkOps, { session: this.session });
    }
  }

  async searchUsers(
    query: string,
    options: {
      limit: number;
      cursor?: string;
    },
  ): Promise<{
    users: UserEntity[];
    nextCursor?: string;
  }> {
    const searchQuery: Record<string, unknown> = {
      $text: { $search: query },
      isDelete: false,
    };

    if (options.cursor) {
      searchQuery._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const docs = await UserModel.find(searchQuery)
      .select("-password")
      .sort({ score: { $meta: "textScore" }, _id: -1 })
      .limit(options.limit + 1)
      .lean();

    const hasNext = docs.length > options.limit;
    const sliced = hasNext ? docs.slice(0, options.limit) : docs;

    return {
      users: sliced.map((doc) => this.mapToEntity(doc, UserEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }
}
