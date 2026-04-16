import {
  EConversationRole,
  EConversationType,
  IConversationMember,
  IConversationProps,
  IConversationSettings,
  ICreateDirectConversationInput,
  ICreateGroupConversationInput,
  ILastMessageSnapshot,
  CONVERSATION_CONSTANTS,
} from "./conversation.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class ConversationEntity {
  private readonly props: IConversationProps;
  readonly id?: string;

  constructor(props: IConversationProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<IConversationProps> {
    return Object.freeze({ ...this.props });
  }

  get type(): EConversationType {
    return this.props.type;
  }

  get members(): ReadonlyArray<IConversationMember> {
    return [...this.props.members];
  }

  get memberIds(): string[] {
    return this.props.members.map((m) => m.userId);
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get avatarMediaId(): string | undefined {
    return this.props.avatarMediaId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get lastMessage(): ILastMessageSnapshot | undefined {
    return this.props.lastMessage;
  }

  get pinnedMessageIds(): ReadonlyArray<string> {
    return [...this.props.pinnedMessageIds];
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get settings(): IConversationSettings | undefined {
    return this.props.settings;
  }

  get isDirect(): boolean {
    return this.props.type === EConversationType.DIRECT;
  }

  get isGroup(): boolean {
    return this.props.type === EConversationType.GROUP;
  }

  get memberCount(): number {
    return this.props.members.length;
  }

  // --------------------------------------------------------------------------
  // Member Queries
  // --------------------------------------------------------------------------

  isMember(userId: string): boolean {
    return this.props.members.some((m) => m.userId === userId);
  }

  getMember(userId: string): IConversationMember | undefined {
    return this.props.members.find((m) => m.userId === userId);
  }

  isAdmin(userId: string): boolean {
    const member = this.getMember(userId);
    return member?.role === EConversationRole.OWNER;
  }

  isOwner(userId: string): boolean {
    const member = this.getMember(userId);
    return member?.role === EConversationRole.OWNER;
  }

  /**
   * Get the other participant in a direct conversation.
   */
  getOtherMemberId(userId: string): string | undefined {
    if (!this.isDirect) return undefined;
    const other = this.props.members.find((m) => m.userId !== userId);
    return other?.userId;
  }

  /**
   * Check if user can send messages in this conversation.
   * - Must be a member
   * - Conversation must not be deleted
   */
  canUserSendMessage(userId: string): boolean {
    return this.isMember(userId) && !this.props.isDeleted;
  }

  /**
   * Check if user has admin privileges (admin or owner).
   */
  canManageMembers(userId: string): boolean {
    return this.isGroup && this.isAdmin(userId);
  }

  /**
   * Check if conversation is muted for a user.
   */
  isMutedFor(userId: string): boolean {
    const member = this.getMember(userId);
    if (!member?.mutedUntil) return false;
    return member.mutedUntil > new Date();
  }

  /**
   * Check if conversation is archived for a user.
   */
  isArchivedFor(userId: string): boolean {
    const member = this.getMember(userId);
    return member?.isArchived ?? false;
  }

  /**
   * Check if conversation is pinned for a user.
   */
  isPinnedFor(userId: string): boolean {
    const member = this.getMember(userId);
    return member?.isPinned ?? false;
  }

  // --------------------------------------------------------------------------
  // Domain Logic — Mutation
  // --------------------------------------------------------------------------

  addMember(userId: string, role: EConversationRole = EConversationRole.MEMBER): void {
    if (this.isMember(userId)) {
      throw new Error("User is already a member of this conversation");
    }

    if (this.props.members.length >= CONVERSATION_CONSTANTS.MAX_GROUP_MEMBERS) {
      throw new Error(`Group cannot exceed ${CONVERSATION_CONSTANTS.MAX_GROUP_MEMBERS} members`);
    }

    this.props.members.push({
      userId,
      role,
      joinedAt: new Date(),
      isArchived: false,
      isPinned: false,
    });
    this.props.updatedAt = new Date();
  }

  removeMember(userId: string): void {
    const index = this.props.members.findIndex((m) => m.userId === userId);
    if (index === -1) {
      throw new Error("User is not a member of this conversation");
    }

    if (this.isOwner(userId)) {
      throw new Error("Owner cannot be removed from the conversation");
    }

    this.props.members.splice(index, 1);
    this.props.updatedAt = new Date();
  }



  pinMessage(messageId: string): void {
    if (this.props.pinnedMessageIds.includes(messageId)) return;
    if (this.props.pinnedMessageIds.length >= CONVERSATION_CONSTANTS.MAX_PINNED_MESSAGES) {
      throw new Error(`Cannot pin more than ${CONVERSATION_CONSTANTS.MAX_PINNED_MESSAGES} messages`);
    }
    this.props.pinnedMessageIds.push(messageId);
    this.props.updatedAt = new Date();
  }

  unpinMessage(messageId: string): void {
    const index = this.props.pinnedMessageIds.indexOf(messageId);
    if (index === -1) return;
    this.props.pinnedMessageIds.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  updateLastMessage(snapshot: ILastMessageSnapshot): void {
    this.props.lastMessage = snapshot;
    this.props.updatedAt = new Date();
  }

  updateGroupInfo(updates: { name?: string; avatarMediaId?: string }): void {
    if (!this.isGroup) throw new Error("Cannot update info for direct conversations");
    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.avatarMediaId !== undefined) this.props.avatarMediaId = updates.avatarMediaId;
    this.props.updatedAt = new Date();
  }

  updateSettings(settings: Partial<IConversationSettings>): void {
    if (!this.props.settings) {
      this.props.settings = {};
    }
    if (settings.themeId !== undefined) this.props.settings.themeId = settings.themeId;
    if (settings.quickEmoji !== undefined) this.props.settings.quickEmoji = settings.quickEmoji;
    if (settings.nicknames !== undefined) {
      this.props.settings.nicknames = {
        ...this.props.settings.nicknames,
        ...settings.nicknames,
      };
    }
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory Methods
  // --------------------------------------------------------------------------

  static createDirect(input: ICreateDirectConversationInput): ConversationEntity {
    const now = new Date();

    const members: IConversationMember[] = [
      {
        userId: input.creatorId,
        role: EConversationRole.MEMBER,
        joinedAt: now,
        isArchived: false,
        isPinned: false,
      },
      {
        userId: input.participantId,
        role: EConversationRole.MEMBER,
        joinedAt: now,
        isArchived: false,
        isPinned: false,
      },
    ];

    return new ConversationEntity({
      type: EConversationType.DIRECT,
      members,
      createdBy: input.creatorId,
      pinnedMessageIds: [],
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createGroup(input: ICreateGroupConversationInput): ConversationEntity {
    const now = new Date();

    const uniqueMemberIds = [...new Set([input.creatorId, ...input.memberIds])];

    if (uniqueMemberIds.length > CONVERSATION_CONSTANTS.MAX_GROUP_MEMBERS) {
      throw new Error(`Group cannot exceed ${CONVERSATION_CONSTANTS.MAX_GROUP_MEMBERS} members`);
    }

    const members: IConversationMember[] = uniqueMemberIds.map((userId) => ({
      userId,
      role: userId === input.creatorId ? EConversationRole.OWNER : EConversationRole.MEMBER,
      joinedAt: now,
      isArchived: false,
      isPinned: false,
    }));

    return new ConversationEntity({
      type: EConversationType.GROUP,
      members,
      name: input.name,
      avatarMediaId: input.avatarMediaId,
      createdBy: input.creatorId,
      pinnedMessageIds: [],
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  toSnapshot() {
    return {
      id: this.id,
      ...this.props,
    };
  }
}
