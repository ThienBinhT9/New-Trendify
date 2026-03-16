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

export interface IPictureUrl {
  original?: string;
  small?: string;
  medium?: string;
  large?: string;
}

export interface IUser {
  id: string;
  email: string;
  username: string;

  firstName: string;
  lastName?: string;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: Date;
  coverPicture?: IPictureUrl;
  profilePicture?: IPictureUrl;

  // Counters
  postCount: number;
  followerCount: number;
  followingCount: number;

  isVerified: boolean;
  accountType: EAccountType;

  // === SECURITY ===
  lastPasswordChangedAt?: Date;

  // === ACTIVITY TRACKING ===
  lastActiveAt?: Date;
  lastLoginAt?: Date;

  isOnboarding: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSuggestion {
  id: string;
  firstName?: string;
  lastName?: string;
  display: string;
  username: string;
  profilePicture?: string;
}
