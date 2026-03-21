import { ECommonVisibility } from "../user-setting";
import { EPostStatus, EPostType, IPostCreateInput, IPostHashtag, IPostProps } from "./post.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class PostEntity {
  private readonly props: IPostProps;
  id?: string;

  constructor(props: IPostProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<IPostProps> {
    return Object.freeze({ ...this.props, id: this.id });
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get mediaIds(): readonly string[] {
    return this.props.mediaIds;
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

  isDraft(): boolean {
    return this.props.status === EPostStatus.DRAFT;
  }

  isActive(): boolean {
    return this.props.status === EPostStatus.ACTIVE;
  }

  isDeleted(): boolean {
    return !this.isActive();
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
    if (!this.isActive()) {
      throw new Error("Cannot modify a deleted post");
    }
  }

  private ensureCanModify(): void {
    this.ensureNotDeleted();
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

  // --------------------------------------------------------------------------
  // Static Factory Methods
  // --------------------------------------------------------------------------

  static create(input: IPostCreateInput): PostEntity {
    const hasContent = !!input.content?.trim();
    const hasMedia = input.mediaIds && input.mediaIds.length > 0;

    if (!hasContent && !hasMedia) {
      throw new Error("Post must have content or media");
    }

    const now = new Date();

    const props: IPostProps = {
      // Identity
      authorId: input.authorId,
      type: input.type ?? EPostType.TEXT,

      // Content
      content: input.content,
      mediaIds: input.mediaIds ?? [],
      hashtags: input.content ? PostEntity.extractHashtags(input.content) : [],
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
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });

      if (hashtags.length === 30) break;
    }

    return hashtags;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.authorId === userId;
  }

  canInteract(): boolean {
    return this.isActive();
  }

  toSnapshot(): IPostProps & { id?: string } {
    return {
      ...this.props,
      id: this.id,
    };
  }
}
