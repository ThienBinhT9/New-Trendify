export interface ISessionProps {
  userId: string;
  deviceId: string;

  refreshTokenHash: string;

  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;

  isRevoked: boolean;

  createdAt: Date;
  updatedAt: Date;
}
