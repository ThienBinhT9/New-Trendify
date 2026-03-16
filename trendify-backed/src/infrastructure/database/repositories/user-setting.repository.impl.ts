import {
  IUserSettingsRepository,
  UserSettingsEntity,
  IUserSettingsProps,
} from "@/domain/user-setting";
import { ClientSession } from "mongoose";
import { BaseRepository } from "./base.repository";
import { SettingsModel } from "../models/user-setting.model";

export class MongooseSettingsRepository
  extends BaseRepository<UserSettingsEntity, IUserSettingsProps>
  implements IUserSettingsRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async save(setting: UserSettingsEntity): Promise<void> {
    await SettingsModel.updateOne({ _id: setting.id }, setting.data, {
      session: this.session,
    });
  }

  async update(setting: UserSettingsEntity): Promise<UserSettingsEntity> {
    const doc = await SettingsModel.findByIdAndUpdate(setting.id, setting.data, {
      new: true,
      session: this.session,
    });

    if (!doc) throw new Error("Session not found");
    return this.mapToEntity(doc, UserSettingsEntity);
  }

  async create(setting: UserSettingsEntity): Promise<UserSettingsEntity> {
    const [doc] = await SettingsModel.create([setting.data], { session: this.session });

    return this.mapToEntity(doc.toObject(), UserSettingsEntity);
  }

  async findByUserId(userId: string): Promise<UserSettingsEntity | null> {
    const doc = await SettingsModel.findOne({ userId }).lean();
    if (!doc) return null;

    return this.mapToEntity(doc, UserSettingsEntity);
  }
}
