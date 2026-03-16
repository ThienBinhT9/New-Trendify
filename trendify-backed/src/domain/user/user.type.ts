/* ================== ENUMS ================== */
export enum EUserIntentStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  CONSUMED = "CONSUMED",
}

export enum EUserGender {
  OTHER = "other",
  MALE = "male",
  FEMALE = "female",
}

export enum EAccountType {
  PERSONAL = "personal",
  BUSINESS = "business",
  CREATOR = "creator",
}

export interface IUserProps {
  // === AUTHENTICATION ===
  email: string;
  password: string;
  username: string;

  // === PROFILE INFO ===
  firstName: string;
  lastName?: string;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: Date;
  profilePicture?: string;  // Media ID for profile picture
  coverPicture?: string;    // Media ID for cover picture

  // Counters
  postCount: number;
  followerCount: number;
  followingCount: number;

  // === VERIFICATION & STATUS ===
  isVerified: boolean;
  accountType: EAccountType;

  // === SECURITY ===
  passwordVersion: number;
  lastPasswordChangedAt?: Date;

  // === ACTIVITY TRACKING ===
  lastActiveAt?: Date;
  lastLoginAt?: Date;

  isOnboarding: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserProps {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName?: string;
}

export interface IUpdateProfileProps {
  firstName?: string;
  lastName?: string;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: Date;
  profilePicture?: string;  // Media ID
  coverPicture?: string;    // Media ID
}

/* ================== CACHE LAYER TYPES ================== */

/**
 * Layer 1: Base profile — rarely changes (identity, avatar, verified)
 * TTL: 1 hour | Invalidate on: profile update
 */
export interface IUserBaseCache {
  id?: string;
  username: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string | Record<string, string>;  // Media ID or { [variantType]: url }
  coverPicture?: string | Record<string, string>;    // Media ID or { [variantType]: url }
  isVerified: boolean;
  accountType: EAccountType;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: Date;
  createdAt: Date;
}

/**
 * Layer 2: Stats counters — high-frequency changes
 * Uses Redis native INCR/DECR for real-time accuracy
 * Invalidate on: follow/unfollow/post create/delete
 */
export interface IUserStatsCache {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

/**
 * Backward compatibility: Combined base + stats
 * Used by post usecases that need full user info
 */
export interface IUserBasicInfo extends IUserBaseCache, IUserStatsCache {}
