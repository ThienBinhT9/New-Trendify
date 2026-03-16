import { IUserSettingsProps, ECommonVisibility } from "./user-setting.type";

/**
 * Allowed fields that can be updated
 */
type UpdatableSettings = Partial<Omit<IUserSettingsProps, "userId" | "createdAt" | "updatedAt">>;

export class UserSettingsEntity {
  private props: IUserSettingsProps;
  readonly id?: string;

  constructor(props: IUserSettingsProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  get data(): Readonly<IUserSettingsProps> {
    return Object.freeze({ ...this.props });
  }

  // ====================== VISIBILITY CHECKS ======================

  isProfilePublic(): boolean {
    return this.props.profileVisibility === ECommonVisibility.PUBLIC;
  }

  isProfilePrivate(): boolean {
    return this.props.profileVisibility === ECommonVisibility.PRIVATE;
  }

  isProfileFollowerOnly(): boolean {
    return this.props.profileVisibility === ECommonVisibility.FOLLOWER;
  }

  // ====================== PERMISSION CHECKS ======================

  /**
   * Check if user can view this profile
   */
  canViewProfile(isFollowing: boolean, isOwner: boolean): boolean {
    if (isOwner) return true;
    if (this.isProfilePublic()) return true;
    if (this.isProfileFollowerOnly() && isFollowing) return true;
    return false;
  }

  /**
   * Check if user can be followed directly (without request)
   */
  canBeFollowedDirectly(): boolean {
    return this.isProfilePublic();
  }

  /**
   * Check if user accepts follow requests
   */
  canReceiveFollow(): boolean {
    return this.props.allowFollow;
  }

  /**
   * Check if user can be tagged in posts/comments
   */
  canBeTagged(): boolean {
    return this.props.allowTagging;
  }

  /**
   * Check if user allows comments on their profile
   */
  canCommentOnProfile(): boolean {
    return this.props.allowCommentOnProfile;
  }

  /**
   * Check if user accepts direct messages
   */
  canReceiveMessage(): boolean {
    return this.props.allowMessage;
  }

  /**
   * Check if online status should be shown
   */
  shouldShowOnlineStatus(): boolean {
    return this.props.showOnlineStatus;
  }

  /**
   * Check if last active time should be shown
   */
  shouldShowLastActiveTime(): boolean {
    return this.props.showLastActiveTime;
  }

  // ====================== MUTATIONS ======================

  /**
   * Update settings with partial data
   */
  changePrivacy(updates: UpdatableSettings): void {
    // Only update fields that are provided and valid
    if (updates.profileVisibility !== undefined) {
      this.props.profileVisibility = updates.profileVisibility;
    }
    if (updates.allowFollow !== undefined) {
      this.props.allowFollow = updates.allowFollow;
    }
    if (updates.allowTagging !== undefined) {
      this.props.allowTagging = updates.allowTagging;
    }
    if (updates.allowCommentOnProfile !== undefined) {
      this.props.allowCommentOnProfile = updates.allowCommentOnProfile;
    }
    if (updates.allowMessage !== undefined) {
      this.props.allowMessage = updates.allowMessage;
    }
    if (updates.showOnlineStatus !== undefined) {
      this.props.showOnlineStatus = updates.showOnlineStatus;
    }
    if (updates.showLastActiveTime !== undefined) {
      this.props.showLastActiveTime = updates.showLastActiveTime;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Set profile to private mode
   */
  setPrivate(): void {
    this.props.profileVisibility = ECommonVisibility.PRIVATE;
    this.props.updatedAt = new Date();
  }

  /**
   * Set profile to public mode
   */
  setPublic(): void {
    this.props.profileVisibility = ECommonVisibility.PUBLIC;
    this.props.updatedAt = new Date();
  }

  // ====================== FACTORY METHODS ======================

  /**
   * Create new settings with defaults for a user
   */
  static create(userId: string): UserSettingsEntity {
    const now = new Date();

    return new UserSettingsEntity({
      userId,
      profileVisibility: ECommonVisibility.PUBLIC,
      allowFollow: true,
      allowTagging: true,
      allowCommentOnProfile: true,
      allowMessage: true,
      showOnlineStatus: true,
      showLastActiveTime: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstruct entity from database
   */
  static fromPersistence(props: IUserSettingsProps, id: string): UserSettingsEntity {
    return new UserSettingsEntity(props, id);
  }

  // ====================== SERIALIZATION ======================

  toSnapshot(): IUserSettingsProps & { id?: string } {
    return { ...this.props, id: this.id };
  }
}
