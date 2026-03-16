import { ClientSession } from "mongoose";

import {
  IUserIntentRepository,
  UserIntentEntity,
  IUserIntentProps,
  EUserIntentStatus,
} from "@/domain/user-intent";
import { BaseRepository } from "./base.repository";
import { UserIntentModel } from "../models";

export class MongooseUserIntentRepository
  extends BaseRepository<UserIntentEntity, IUserIntentProps>
  implements IUserIntentRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  /**
   * Create a new intent.
   * Will throw if an active intent (PENDING/VERIFIED) already exists for this email.
   */
  async create(entity: UserIntentEntity): Promise<void> {
    await UserIntentModel.create([entity.data], { session: this.session });
  }

  async save(entity: UserIntentEntity): Promise<void> {
    if (!entity.id) {
      throw new Error("Cannot save intent without id");
    }

    await UserIntentModel.updateOne(
      { _id: entity.id },
      {
        $set: {
          tokenHash: entity.data.tokenHash,
          status: entity.data.status,
          expiresAt: entity.data.expiresAt,
          updatedAt: new Date(),
        },
      },
      { session: this.session },
    );
  }

  /**
   * Find intent by ID.
   */
  async findById(id: string): Promise<UserIntentEntity | null> {
    const doc = await UserIntentModel.findById(id)
      .session(this.session || null)
      .lean();

    if (!doc) return null;
    return this.mapToEntity(doc, UserIntentEntity);
  }

  /**
   * Find active intent (PENDING or VERIFIED) by email.
   * Returns null if no active intent exists.
   */
  async findByEmail(email: string): Promise<UserIntentEntity | null> {
    const doc = await UserIntentModel.findOne({
      email: email.toLowerCase().trim(),
      status: { $in: [EUserIntentStatus.PENDING, EUserIntentStatus.VERIFIED] },
    })
      .session(this.session || null)
      .lean();

    if (!doc) return null;
    return this.mapToEntity(doc, UserIntentEntity);
  }

  /**
   * Find intent by token hash.
   * Used during verification - finds any intent with matching token.
   */
  async findByToken(tokenHash: string): Promise<UserIntentEntity | null> {
    const doc = await UserIntentModel.findOne({ tokenHash })
      .session(this.session || null)
      .lean();

    if (!doc) return null;
    return this.mapToEntity(doc, UserIntentEntity);
  }

  /**
   * Mark intent as consumed.
   * Shortcut method for consuming an intent by ID.
   */
  async consume(intentId: string): Promise<void> {
    await UserIntentModel.updateOne(
      { _id: intentId },
      {
        $set: {
          status: EUserIntentStatus.CONSUMED,
          expiresAt: null,
          updatedAt: new Date(),
        },
      },
      { session: this.session },
    );
  }

  /**
   * Delete expired PENDING intents older than specified date.
   * Used by cleanup job.
   */
  async deleteExpiredPending(before: Date): Promise<number> {
    const result = await UserIntentModel.deleteMany({
      status: EUserIntentStatus.PENDING,
      expiresAt: { $lt: before },
    });
    return result.deletedCount;
  }

  /**
   * Delete expired VERIFIED intents older than specified date.
   * Used by cleanup job.
   */
  async deleteExpiredVerified(before: Date): Promise<number> {
    const result = await UserIntentModel.deleteMany({
      status: EUserIntentStatus.VERIFIED,
      expiresAt: { $lt: before },
    });
    return result.deletedCount;
  }

  /**
   * Delete old CONSUMED intents.
   * Used by cleanup job for data retention.
   */
  async deleteOldConsumed(before: Date): Promise<number> {
    const result = await UserIntentModel.deleteMany({
      status: EUserIntentStatus.CONSUMED,
      updatedAt: { $lt: before },
    });
    return result.deletedCount;
  }
}
