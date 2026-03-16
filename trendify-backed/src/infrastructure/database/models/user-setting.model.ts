import { IUserSettingsProps, ECommonVisibility } from "@/domain/user-setting";
import { Schema, model, Document } from "mongoose";

export interface ISettingsDocument extends IUserSettingsProps, Document {}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    userId: { type: String, required: true, unique: true },

    // Profile Visibility
    profileVisibility: {
      type: String,
      enum: Object.values(ECommonVisibility),
      default: ECommonVisibility.PUBLIC,
    },

    // Interaction Settings
    allowFollow: { type: Boolean, default: true },
    allowTagging: { type: Boolean, default: true },
    allowCommentOnProfile: { type: Boolean, default: true },
    allowMessage: { type: Boolean, default: true },

    // Presence Settings
    showOnlineStatus: { type: Boolean, default: true },
    showLastActiveTime: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Query by profile visibility
settingsSchema.index({ profileVisibility: 1 });

export const SettingsModel = model<ISettingsDocument>("Settings", settingsSchema);
