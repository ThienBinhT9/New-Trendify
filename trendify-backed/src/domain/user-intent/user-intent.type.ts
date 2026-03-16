export enum EUserIntentStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  CONSUMED = "CONSUMED",
}

export interface IUserIntentProps {
  email: string;
  tokenHash: string;
  status: EUserIntentStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserIntentProps {
  email: string;
  expiresAt: Date;
  tokenHash: string;
}
