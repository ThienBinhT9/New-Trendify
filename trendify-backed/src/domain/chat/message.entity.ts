import {
  EMessageType,
  ICreateMessageInput,
  IMessageProps,
  IMessageReaction,
  IMessageReadReceipt,
  MESSAGE_CONSTANTS,
  MessageReactionEmoji,
} from "./message.type";

export class MessageEntity {
  private readonly props: IMessageProps;
  readonly id?: string;

  constructor(props: IMessageProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<IMessageProps> {
    return Object.freeze({ ...this.props });
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get type(): EMessageType {
    return this.props.type;
  }

  get content(): string | undefined {
    return this.props.content;
  }

  get mediaIds(): ReadonlyArray<string> {
    return this.props.mediaIds ?? [];
  }

  get replyToId(): string | undefined {
    return this.props.replyToId;
  }

  get forwardedFromId(): string | undefined {
    return this.props.forwardedFromId;
  }

  get reactions(): ReadonlyArray<IMessageReaction> {
    return [...this.props.reactions];
  }

  get readBy(): ReadonlyArray<IMessageReadReceipt> {
    return [...this.props.readBy];
  }

  get deliveredTo(): ReadonlyArray<string> {
    return [...this.props.deliveredTo];
  }

  get isUnsent(): boolean {
    return this.props.isUnsent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isForwarded(): boolean {
    return !!this.props.forwardedFromId;
  }

  get isReply(): boolean {
    return !!this.props.replyToId;
  }

  get isSystemMessage(): boolean {
    return this.props.type === EMessageType.SYSTEM;
  }

  // --------------------------------------------------------------------------
  // Content Preview
  // --------------------------------------------------------------------------

  /**
   * Get a truncated content preview for conversation list display.
   */
  getContentPreview(): string {
    if (this.props.isUnsent) return "Tin nhắn đã bị thu hồi";
    if (this.props.type === EMessageType.SYSTEM) return this.props.content ?? "";

    switch (this.props.type) {
      case EMessageType.IMAGE:
        return "📷 Hình ảnh";
      case EMessageType.VIDEO:
        return "🎥 Video";
      case EMessageType.FILE:
        return "📎 File";
      case EMessageType.GIF:
        return "GIF";
      case EMessageType.STICKER:
        return "Sticker";
      case EMessageType.VOICE:
        return "🎤 Tin nhắn thoại";
      case EMessageType.TEXT:
      default: {
        const text = this.props.content ?? "";
        if (text.length <= MESSAGE_CONSTANTS.CONTENT_PREVIEW_LENGTH) return text;
        return text.slice(0, MESSAGE_CONSTANTS.CONTENT_PREVIEW_LENGTH) + "...";
      }
    }
  }

  // --------------------------------------------------------------------------
  // Domain Logic — Queries
  // --------------------------------------------------------------------------

  /**
   * Check if message is deleted for a specific user.
   */
  isDeletedForUser(userId: string): boolean {
    return this.props.deletedFor.includes(userId);
  }

  /**
   * Check if message is visible to a specific user.
   * - Not deleted for this user
   * - If unsent: only show "message recalled" placeholder
   */
  isVisibleTo(userId: string): boolean {
    return !this.isDeletedForUser(userId);
  }

  /**
   * Check if a user has read this message.
   */
  isReadBy(userId: string): boolean {
    return this.props.readBy.some((r) => r.userId === userId);
  }

  /**
   * Check if a user has already reacted with a specific emoji.
   */
  hasReactionFrom(userId: string, emoji?: MessageReactionEmoji): boolean {
    if (emoji) {
      return this.props.reactions.some((r) => r.userId === userId && r.emoji === emoji);
    }
    return this.props.reactions.some((r) => r.userId === userId);
  }

  /**
   * Check if user is the message sender.
   */
  isSentBy(userId: string): boolean {
    return this.props.senderId === userId;
  }

  // --------------------------------------------------------------------------
  // Domain Logic — Mutation
  // --------------------------------------------------------------------------

  /**
   * Add a reaction to the message.
   * Each user can only have one reaction — replaces existing.
   */
  addReaction(userId: string, emoji: MessageReactionEmoji): void {
    // Remove existing reaction from this user
    this.props.reactions = this.props.reactions.filter((r) => r.userId !== userId);

    this.props.reactions.push({
      userId,
      emoji,
      createdAt: new Date(),
    });
    this.props.updatedAt = new Date();
  }

  /**
   * Remove a reaction from the message.
   */
  removeReaction(userId: string, emoji: MessageReactionEmoji): void {
    this.props.reactions = this.props.reactions.filter(
      (r) => !(r.userId === userId && r.emoji === emoji),
    );
    this.props.updatedAt = new Date();
  }

  /**
   * Mark message as read by a user.
   */
  markReadBy(userId: string): void {
    if (this.isReadBy(userId)) return;
    this.props.readBy.push({ userId, readAt: new Date() });
    this.props.updatedAt = new Date();
  }

  /**
   * Mark message as delivered to a user.
   */
  markDeliveredTo(userId: string): void {
    if (this.props.deliveredTo.includes(userId)) return;
    this.props.deliveredTo.push(userId);
    this.props.updatedAt = new Date();
  }

  /**
   * Unsend (recall) message for everyone.
   * Only the sender can unsend.
   */
  unsend(userId: string): void {
    if (!this.isSentBy(userId)) {
      throw new Error("Only the sender can unsend a message");
    }
    if (this.props.isUnsent) {
      throw new Error("Message is already unsent");
    }
    this.props.isUnsent = true;
    this.props.unsentAt = new Date();
    this.props.content = undefined;
    this.props.mediaIds = [];
    this.props.updatedAt = new Date();
  }

  /**
   * Delete message for a specific user (only hides from their view).
   */
  deleteForUser(userId: string): void {
    if (this.isDeletedForUser(userId)) return;
    this.props.deletedFor.push(userId);
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(input: ICreateMessageInput): MessageEntity {
    const now = new Date();

    if (input.type === EMessageType.TEXT && !input.content?.trim()) {
      throw new Error("Text message must have content");
    }

    if (input.content && input.content.length > MESSAGE_CONSTANTS.MAX_TEXT_LENGTH) {
      throw new Error(`Message content cannot exceed ${MESSAGE_CONSTANTS.MAX_TEXT_LENGTH} characters`);
    }

    if (input.mediaIds && input.mediaIds.length > MESSAGE_CONSTANTS.MAX_MEDIA_PER_MESSAGE) {
      throw new Error(`Cannot attach more than ${MESSAGE_CONSTANTS.MAX_MEDIA_PER_MESSAGE} media files`);
    }

    return new MessageEntity({
      conversationId: input.conversationId,
      senderId: input.senderId,
      type: input.type,
      content: input.content?.trim(),
      mediaIds: input.mediaIds ?? [],
      replyToId: input.replyToId,
      forwardedFromId: input.forwardedFromId,
      reactions: [],
      readBy: [{ userId: input.senderId, readAt: now }],
      deliveredTo: [input.senderId],
      deletedFor: [],
      isUnsent: false,
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
