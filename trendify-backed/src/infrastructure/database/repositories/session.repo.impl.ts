import { ISessionProps, ISessionRepository, SessionEntity } from "@/domain/session";
import { BaseRepository } from "./base.repository";
import { ClientSession } from "mongoose";
import { SessionModel } from "../models";

export class MongooseSessionRepository
  extends BaseRepository<SessionEntity, ISessionProps>
  implements ISessionRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(sesion: SessionEntity): Promise<SessionEntity> {
    const [doc] = await SessionModel.create([sesion.data], { session: this.session });

    return this.mapToEntity(doc.toObject(), SessionEntity);
  }

  async update(session: SessionEntity): Promise<SessionEntity> {
    const doc = await SessionModel.findByIdAndUpdate(session.id, session.data, {
      new: true,
      session: this.session,
    });

    if (!doc) throw new Error("Session not found");
    return this.mapToEntity(doc, SessionEntity);
  }

  async findById(id: string): Promise<SessionEntity | null> {
    const doc = await SessionModel.findById(id).lean();
    if (!doc) return null;

    return this.mapToEntity(doc, SessionEntity);
  }

  async findActiveByUserAndDevice(userId: string, deviceId: string): Promise<SessionEntity | null> {
    const doc = await SessionModel.findOne({ userId, deviceId, isRevoked: false }).lean();
    if (!doc) return null;

    return this.mapToEntity(doc, SessionEntity);
  }

  async revokeByUserAndDevice(userId: string, deviceId: string): Promise<void> {
    await SessionModel.updateOne(
      { userId, deviceId, isRevoked: false },
      { isRevoked: true },
      { session: this.session }
    );
  }

  async revokeById(id: string): Promise<void> {
    await SessionModel.updateOne(
      { _id: id, isRevoked: false },
      { isRevoked: true },
      { session: this.session }
    );
  }

  async revokeAll(userId: string): Promise<void> {
    await SessionModel.updateMany({ userId }, { $set: { isRevoked: true } });
  }

  async revokeAllExcept(userId: string, id: string): Promise<void> {
    await SessionModel.updateMany(
      { userId, isRevoked: false, _id: { $ne: id } },
      { $set: { isRevoked: true } }
    );
  }
}
