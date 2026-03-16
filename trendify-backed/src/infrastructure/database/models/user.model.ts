import { Schema, model, Document } from "mongoose";

import { IUserProps, EUserGender } from "@/domain/user";

export interface IUserDocument extends IUserProps, Document {}

//================================ USER ==============================
const userSchema: Schema = new Schema(
  {
    //account info
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    //profile info
    about: { type: String, default: "" },
    gender: { type: String, enum: Object.values(EUserGender), default: EUserGender.OTHER },
    lastName: { type: String },
    firstName: { type: String, required: true },
    dateOfBirth: { type: Date },
    profilePicture: { type: String },  // Media ID
    coverPicture: { type: String },    // Media ID

    //acount status
    isDelete: { type: Boolean, default: false },

    //stats
    postCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    passwordVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes
userSchema.index({ isDelete: 1 }, { partialFilterExpression: { isDelete: false } });
userSchema.index({ username: 1, isDelete: 1 }); // Compound index for username queries
userSchema.index(
  { firstName: "text", lastName: "text", username: "text" },
  { weights: { username: 3, firstName: 2, lastName: 1 } }, // Text index for search
);

export const UserModel = model<IUserDocument>("User", userSchema);
