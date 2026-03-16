import { EUserIntentStatus, ICreateUserIntentProps, IUserIntentProps } from "./user-intent.type";

export class UserIntentEntity {
  private props: IUserIntentProps;
  readonly id?: string;

  constructor(props: IUserIntentProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  get data(): Readonly<IUserIntentProps> {
    return Object.freeze({ ...this.props });
  }

  isPending(): boolean {
    return this.props.status === EUserIntentStatus.PENDING;
  }

  isVerified(): boolean {
    return this.props.status === EUserIntentStatus.VERIFIED;
  }

  isConsumed(): boolean {
    return this.props.status === EUserIntentStatus.CONSUMED;
  }

  isExpired(now: Date = new Date()): boolean {
    return !!this.props.expiresAt && this.props.expiresAt <= now;
  }

  verify(newExpiresAt: Date) {
    if (this.props.status !== EUserIntentStatus.PENDING) {
      throw new Error("Intent is not pending");
    }

    if (!this.props.expiresAt || this.props.expiresAt <= new Date()) {
      throw new Error("Magic link expired");
    }

    this.props.status = EUserIntentStatus.VERIFIED;
    this.props.expiresAt = newExpiresAt;
  }

  consume() {
    if (this.props.status !== EUserIntentStatus.VERIFIED) {
      throw new Error("Intent must be verified before consuming");
    }

    this.props.status = EUserIntentStatus.CONSUMED;
    this.props.expiresAt = null;
  }

  rotateToken(newHashToken: string, newExpiresAt: Date) {
    this.props.tokenHash = newHashToken;
    this.props.expiresAt = newExpiresAt;
  }

  static create(props: ICreateUserIntentProps): UserIntentEntity {
    const now = new Date();

    return new UserIntentEntity({
      ...props,
      status: EUserIntentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  toSnapshot(): IUserIntentProps & { id?: string } {
    return { ...this.props, id: this.id };
  }
}
