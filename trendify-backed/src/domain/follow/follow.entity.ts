import { EFollowStatus, IFollowProps } from "./follow.type";

export class FollowEntity {
  private props: IFollowProps;
  readonly id?: string;

  constructor(props: IFollowProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  /* ================== GETTERS ================== */
  get data(): Readonly<IFollowProps> {
    return Object.freeze({ ...this.props });
  }

  get status(): EFollowStatus {
    return this.props.status;
  }

  get followerId(): string {
    return this.props.followerId;
  }

  get followingId(): string {
    return this.props.followingId;
  }

  /* ================== PREDICATES ================== */
  isPending(): boolean {
    return this.props.status === EFollowStatus.PENDING;
  }

  isAccepted(): boolean {
    return this.props.status === EFollowStatus.ACCEPTED;
  }

  isFollower(userId: string): boolean {
    return this.props.followerId === userId;
  }

  isFollowing(userId: string): boolean {
    return this.props.followingId === userId;
  }

  involves(userId: string): boolean {
    return this.isFollower(userId) || this.isFollowing(userId);
  }

  /* ================== MUTATIONS ================== */
  accept(): void {
    if (!this.isPending()) {
      throw new Error("Only pending requests can be accepted");
    }
    this.props.status = EFollowStatus.ACCEPTED;
    this.props.updatedAt = new Date();
  }

  reject(): void {
    if (!this.isPending()) {
      throw new Error("Only pending requests can be rejected");
    }
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (!this.isPending()) {
      throw new Error("Only pending requests can be cancelled");
    }
    this.props.updatedAt = new Date();
  }

  /* ================== FACTORY ================== */
  static create(followerId: string, followingId: string): FollowEntity {
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }

    const now = new Date();
    return new FollowEntity({
      followerId,
      followingId,
      status: EFollowStatus.ACCEPTED,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createRequest(followerId: string, followingId: string): FollowEntity {
    if (followerId === followingId) {
      throw new Error("Cannot send follow request to yourself");
    }

    const now = new Date();
    return new FollowEntity({
      followerId,
      followingId,
      status: EFollowStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: IFollowProps, id: string): FollowEntity {
    return new FollowEntity(props, id);
  }

  toSnapshot() {
    return { id: this.id, ...this.props };
  }
}
