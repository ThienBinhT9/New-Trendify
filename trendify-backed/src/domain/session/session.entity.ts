import { addTime } from "@/shared/utils";
import { ISessionProps } from "./session.type";

export interface ICreateSessionProps {
  userId: string;
  deviceId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
}

export class SessionEntity {
  private props: ISessionProps;
  readonly id?: string;

  constructor(props: ISessionProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  get data(): Readonly<ISessionProps> {
    return Object.freeze({ ...this.props });
  }

  isRevoked(): boolean {
    return this.props.isRevoked;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  revoke(): void {
    this.props.isRevoked = true;
  }

  rotate(newRefreshTokenHash: string) {
    this.props.refreshTokenHash = newRefreshTokenHash;
    this.props.expiresAt = addTime(null, 30, "day");
  }

  static create(props: ICreateSessionProps): SessionEntity {
    const now = new Date();
    return new SessionEntity({
      ...props,
      isRevoked: false,
      expiresAt: addTime(null, 30, "day"),
      createdAt: now,
      updatedAt: now,
    });
  }

  toSnapshot() {
    return { ...this.props, id: this.id };
  }
}
