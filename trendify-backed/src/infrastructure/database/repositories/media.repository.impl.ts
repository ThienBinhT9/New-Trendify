import { Types } from "mongoose";
import {
  IMediaRepository,
  FindMediaByUserOptions,
  MediaEntity,
  IMediaProps,
  EMediaStatus,
  IMediaVariant,
} from "@/domain/media";
import { MediaModel } from "../models/media.model";
import { BaseRepository } from "./base.repository";

export class MongooseMediaRepository
  extends BaseRepository<MediaEntity, IMediaProps>
  implements IMediaRepository
{
  // ====================== CRUD ======================

  async create(media: MediaEntity): Promise<MediaEntity> {
    const data = {
      ...media.data,
      userId: new Types.ObjectId(media.data.userId),
    };

    const doc = await MediaModel.create(data);
    return this.mapToEntity(doc.toObject(), MediaEntity);
  }

  async save(media: MediaEntity): Promise<void> {
    await MediaModel.findByIdAndUpdate(media.id, {
      $set: {
        ...media.data,
        userId: new Types.ObjectId(media.data.userId),
      },
    });
  }

  async deleteById(mediaId: string): Promise<void> {
    await MediaModel.findByIdAndDelete(mediaId);
  }

  async deleteByIds(mediaIds: string[]): Promise<void> {
    const objectIds = mediaIds.map((id) => new Types.ObjectId(id));
    await MediaModel.deleteMany({ _id: { $in: objectIds } });
  }

  // ====================== QUERIES ======================

  async findById(mediaId: string): Promise<MediaEntity | null> {
    try {
      const doc = await MediaModel.findById(mediaId).lean();
      if (!doc) return null;
      return this.mapToEntity(doc, MediaEntity);
    } catch {
      return null;
    }
  }

  async findByKey(key: string): Promise<MediaEntity | null> {
    const doc = await MediaModel.findOne({ key }).lean();
    if (!doc) return null;
    return this.mapToEntity(doc, MediaEntity);
  }

  async findByIds(mediaIds: string[]): Promise<MediaEntity[]> {
    try {
      const docs = await MediaModel.find({ _id: { $in: mediaIds } }).lean();
      return docs.map((doc) => this.mapToEntity(doc, MediaEntity));
    } catch (error) {
      return [];
    }
  }

  async findByUser(options: FindMediaByUserOptions): Promise<MediaEntity[]> {
    const query: any = { userId: new Types.ObjectId(options.userId) };

    if (options.purpose) query.purpose = options.purpose;
    if (options.status) query.status = options.status;
    if (options.cursor) query._id = { $lt: new Types.ObjectId(options.cursor) };

    const limit = options.limit ?? 20;

    const docs = await MediaModel.find(query).sort({ _id: -1 }).limit(limit).lean();

    return docs.map((doc) => this.mapToEntity(doc, MediaEntity));
  }

  // ====================== STATUS UPDATES ======================

  async updateStatus(mediaId: string, status: EMediaStatus): Promise<void> {
    await MediaModel.findByIdAndUpdate(mediaId, {
      $set: { status, updatedAt: new Date() },
    });
  }

  async addVariants(mediaId: string, variants: IMediaVariant[]): Promise<void> {
    await MediaModel.findByIdAndUpdate(mediaId, {
      $push: { variants: { $each: variants } },
      $set: { updatedAt: new Date() },
    });
  }

  // ====================== CLEANUP ======================

  async findExpiredPending(limit?: number): Promise<MediaEntity[]> {
    const docs = await MediaModel.find({
      status: EMediaStatus.PENDING_UPLOAD,
      expiresAt: { $lt: new Date() },
    })
      .limit(limit ?? 100)
      .lean();

    return docs.map((doc) => this.mapToEntity(doc, MediaEntity));
  }

  async deleteExpiredPending(): Promise<number> {
    const result = await MediaModel.deleteMany({
      status: EMediaStatus.PENDING_UPLOAD,
      expiresAt: { $lt: new Date() },
    });

    return result.deletedCount;
  }
}
