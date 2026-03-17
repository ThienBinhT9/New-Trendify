import { ECommonVisibility } from "../user-setting";
import {
  EPostStatus,
  EPostType,
  IPostCounters,
  IPostCreateInput,
  IPostHashtag,
  IPostMention,
  IPostProps,
  IPostUpdateInput,
} from "./post.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class PostEntity {
  private readonly props: IPostProps;
  readonly id?: string;

  constructor(props: IPostProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<IPostProps> {
    return Object.freeze({ ...this.props });
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get type(): EPostType {
    return this.props.type;
  }

  get content(): string | undefined {
    return this.props.content;
  }

  get mediaIds(): readonly string[] {
    return Object.freeze([...this.props.mediaIds]);
  }

  get hashtags(): readonly IPostHashtag[] {
    return Object.freeze([...this.props.hashtags]);
  }

  get mentions(): readonly IPostMention[] {
    return Object.freeze([...this.props.mentions]);
  }

  get counters(): Readonly<IPostCounters> {
    return Object.freeze({ ...this.props.counters });
  }

  get isReply(): boolean {
    return !!this.props.replyToId;
  }

  get isThread(): boolean {
    return !!this.props.rootPostId;
  }

  // --------------------------------------------------------------------------
  // Status Methods
  // --------------------------------------------------------------------------

  isDeleted(): boolean {
    return this.props.status === EPostStatus.DELETED;
  }

  isDraft(): boolean {
    return this.props.status === EPostStatus.DRAFT;
  }

  isHidden(): boolean {
    return this.props.status === EPostStatus.HIDDEN;
  }

  isActive(): boolean {
    return this.props.status === EPostStatus.ACTIVE;
  }

  // --------------------------------------------------------------------------
  // Visibility Methods
  // --------------------------------------------------------------------------

  isPublic(): boolean {
    return this.props.settings.visibility === ECommonVisibility.PUBLIC;
  }

  isFollowerOnly(): boolean {
    return this.props.settings.visibility === ECommonVisibility.FOLLOWER;
  }

  isPrivate(): boolean {
    return this.props.settings.visibility === ECommonVisibility.PRIVATE;
  }

  // --------------------------------------------------------------------------
  // Type Methods
  // --------------------------------------------------------------------------

  hasMedia(): boolean {
    return this.props.mediaIds.length > 0;
  }

  hasLocation(): boolean {
    return !!this.props.location;
  }

  // --------------------------------------------------------------------------
  // Mutation Methods
  // --------------------------------------------------------------------------

  private ensureNotDeleted(): void {
    if (this.isDeleted()) {
      throw new Error("Cannot modify a deleted post");
    }
  }

  private ensureCanModify(): void {
    this.ensureNotDeleted();
  }

  hide(): void {
    this.ensureCanModify();
    this.props.status = EPostStatus.HIDDEN;
    this.props.updatedAt = new Date();
  }

  restore(): void {
    if (this.props.status === EPostStatus.HIDDEN) {
      this.props.status = EPostStatus.ACTIVE;
      this.props.updatedAt = new Date();
    }
  }

  delete(): void {
    this.props.status = EPostStatus.DELETED;
    this.props.updatedAt = new Date();
  }

  publish(): void {
    if (this.props.status === EPostStatus.DRAFT) {
      this.props.status = EPostStatus.ACTIVE;
      this.props.updatedAt = new Date();
    }
  }

  pin(): void {
    this.ensureCanModify();
    this.props.isPinned = true;
    this.props.updatedAt = new Date();
  }

  unpin(): void {
    this.ensureCanModify();
    this.props.isPinned = false;
    this.props.updatedAt = new Date();
  }

  update(input: IPostUpdateInput): void {
    this.ensureCanModify();

    // Content update
    if (input.content !== undefined) {
      this.props.content = input.content;
      this.props.hashtags = PostEntity.extractHashtags(input.content);
    }

    // Media update
    if (input.mediaIds !== undefined) {
      this.props.mediaIds = input.mediaIds;
    }

    // Post type update (determined by use case based on media)
    if (input.type !== undefined) {
      this.props.type = input.type;
    }

    // Mentions update
    if (input.mentions !== undefined) {
      this.props.mentions = input.mentions;
    }

    // Location update (null to remove)
    if (input.location !== undefined) {
      this.props.location = input.location ?? undefined;
    }

    // Settings updates
    if (input.visibility !== undefined) {
      this.props.settings.visibility = input.visibility;
    }
    if (input.allowLike !== undefined) {
      this.props.settings.allowLike = input.allowLike;
    }
    if (input.allowSave !== undefined) {
      this.props.settings.allowSave = input.allowSave;
    }
    if (input.allowShare !== undefined) {
      this.props.settings.allowShare = input.allowShare;
    }
    if (input.allowComment !== undefined) {
      this.props.settings.allowComment = input.allowComment;
    }
    if (input.allowDownload !== undefined) {
      this.props.settings.allowDownload = input.allowDownload;
    }

    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory Methods
  // --------------------------------------------------------------------------

  static create(input: IPostCreateInput): PostEntity {
    const hasContent = !!input.content?.trim();
    const hasMedia = input.mediaIds && input.mediaIds.length > 0;

    if (!hasContent && !hasMedia) {
      throw new Error("Post must have content or media");
    }

    const hashtags = input.content ? PostEntity.extractHashtags(input.content) : [];

    const now = new Date();

    const props: IPostProps = {
      // Identity
      authorId: input.authorId,
      type: input.type ?? EPostType.TEXT,

      // Content
      content: input.content,
      mediaIds: input.mediaIds ?? [],
      hashtags,
      mentions: input.mentions ?? [],

      // Relationships
      replyToId: input.replyToId,
      rootPostId: undefined, // Set by usecase when creating reply

      // Location
      location: input.location,

      // Status & Settings
      status: input.isDraft ? EPostStatus.DRAFT : EPostStatus.ACTIVE,
      settings: {
        visibility: input.visibility ?? ECommonVisibility.PUBLIC,
        allowLike: true,
        allowSave: true,
        allowShare: true,
        allowComment: true,
        allowDownload: true,
      },
      isPinned: false,

      // Counters
      counters: {
        likeCount: 0,
        viewCount: 0,
        shareCount: 0,
        commentCount: 0,
        repostCount: 0,
        saveCount: 0,
      },

      // Timestamps
      createdAt: now,
      updatedAt: now,
    };

    return new PostEntity(props);
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Extract hashtags from content
   * Supports Unicode hashtags (e.g., #café, #日本語)
   */
  static extractHashtags(content: string): IPostHashtag[] {
    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const seen = new Set<string>();
    const hashtags: IPostHashtag[] = [];

    for (const match of content.matchAll(hashtagRegex)) {
      const tag = match[1];
      if (seen.has(tag)) continue;
      seen.add(tag);

      hashtags.push({
        tag,
        startIndex: match.index, // vị trí của '#'
        endIndex: match.index + match[0].length, // sau ký tự cuối của hashtag
      });

      if (hashtags.length === 30) break;
    }

    return hashtags;
  }

  /**
   * Create snapshot for serialization
   */
  toSnapshot() {
    return {
      id: this.id,
      ...this.props,
    };
  }

  /**
   * Check if user is author of this post
   */
  isOwnedBy(userId: string): boolean {
    return this.props.authorId === userId;
  }

  /**
   * Check if post can be interacted with (not deleted, not draft)
   */
  canInteract(): boolean {
    return this.isActive() || this.isHidden();
  }
}
