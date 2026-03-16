import {
  EAccountType,
  EUserGender,
  ICreateUserProps,
  IUpdateProfileProps,
  IUserBaseCache,
  IUserProps,
  IUserStatsCache,
} from "./user.type";

/* ================== ENTITY ================== */
export class UserEntity {
  private props: IUserProps;
  readonly id?: string;

  constructor(props: IUserProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  /* ================== GETTERS ================== */
  get data(): Readonly<IUserProps> {
    return Object.freeze({ ...this.props });
  }

  get fullName(): string {
    return [this.props.firstName, this.props.lastName].filter(Boolean).join(" ");
  }

  updateProfile(profile: IUpdateProfileProps): void {
    Object.assign(this.props, profile);
  }

  updatePassword(newPassword: string): void {
    this.props.password = newPassword;
    this.props.passwordVersion += 1;
  }

  completeOnboarding(): void {
    this.props.isOnboarding = true;
  }

  // FACTORY METHOD
  static create(props: ICreateUserProps): UserEntity {
    const now = new Date();

    return new UserEntity({
      ...props,
      about: undefined,
      gender: EUserGender.OTHER,
      dateOfBirth: undefined,
      profilePicture: undefined,
      coverPicture: undefined,
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
      passwordVersion: 0,
      lastPasswordChangedAt: undefined,
      isVerified: false,
      accountType: EAccountType.PERSONAL,
      lastActiveAt: undefined,
      lastLoginAt: undefined,
      isOnboarding: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Layer 1: Base identity info (rarely changes, 1h TTL)
   */
  toBaseInfo(): IUserBaseCache {
    return {
      id: this.id,
      username: this.props.username,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      profilePicture: this.props.profilePicture,
      coverPicture: this.props.coverPicture,
      isVerified: this.props.isVerified,
      accountType: this.props.accountType,
      createdAt: this.props.createdAt,
      about: this.props.about,
      dateOfBirth: this.props.dateOfBirth,
      gender: this.props.gender,
    };
  }

  /**
   * Layer 2: Stats counters (high-frequency, use Redis INCR/DECR)
   */
  toStatsInfo(): IUserStatsCache {
    return {
      postCount: this.props.postCount,
      followerCount: this.props.followerCount,
      followingCount: this.props.followingCount,
    };
  }

  /**
   * Backward compatibility: Combined base + stats
   */
  toBasicInfo() {
    return {
      ...this.toBaseInfo(),
      ...this.toStatsInfo(),
    };
  }

  toSnapshot(): Omit<IUserProps, "password"> & { id?: string } {
    const { password, ...passData } = this.props;
    return { ...passData, id: this.id };
  }
}
