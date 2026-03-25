import {
  ECommentStatus,
  ICommentCreateInput,
  ICommentHashtag,
  ICommentProps,
} from "./comment.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class CommentEntity {
  private readonly props: ICommentProps;
  readonly id?: string;

  constructor(props: ICommentProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<ICommentProps> {
    return Object.freeze({ ...this.props });
  }

  get postId(): string {
    return this.props.postId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get parentId(): string | undefined {
    return this.props.parentId;
  }

  get rootCommentId(): string | undefined {
    return this.props.rootCommentId;
  }

  get content(): string {
    return this.props.content;
  }

  get replyCount(): number {
    return this.props.counters.replyCount;
  }

  get likeCount(): number {
    return this.props.counters.likeCount;
  }

  get status(): ECommentStatus {
    return this.props.status;
  }

  // --------------------------------------------------------------------------
  // Status Methods
  // --------------------------------------------------------------------------

  isDeleted(): boolean {
    return this.props.status === ECommentStatus.DELETED;
  }

  isActive(): boolean {
    return this.props.status === ECommentStatus.ACTIVE;
  }

  isReply(): boolean {
    return !!this.props.parentId;
  }

  // --------------------------------------------------------------------------
  // Authorization
  // --------------------------------------------------------------------------

  isOwnedBy(userId: string): boolean {
    return this.props.authorId === userId;
  }

  /**
   * Comment can be deleted by:
   * - The comment author
   * - The post author
   */
  canDelete(userId: string, postAuthorId: string): boolean {
    return this.isOwnedBy(userId) || userId === postAuthorId;
  }

  // --------------------------------------------------------------------------
  // Mutation Methods
  // --------------------------------------------------------------------------

  delete(): void {
    this.props.status = ECommentStatus.DELETED;
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(input: ICommentCreateInput): CommentEntity {
    if (!input.content?.trim()) {
      throw new Error("Comment must have content");
    }

    if (input.content.length > 2200) {
      throw new Error("Comment content must be at most 2200 characters");
    }

    const now = new Date();
    const normalizedContent = input.content.trim();
    const hashtags = this.extractHashtags(normalizedContent);

    const props: ICommentProps = {
      postId: input.postId,
      authorId: input.authorId,
      parentId: input.parentId,
      rootCommentId: input.rootCommentId,
      content: normalizedContent,
      mentions: input.mentions ?? [],
      hashtags,
      counters: {
        replyCount: 0,
        likeCount: 0,
      },
      status: ECommentStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    return new CommentEntity(props);
  }

  private static extractHashtags(content: string): ICommentHashtag[] {
    const hashtags: ICommentHashtag[] = [];
    const hashtagRegex = /(^|\s)(#[\p{L}\p{N}_]+)/gu;
    let match: RegExpExecArray | null = null;

    while ((match = hashtagRegex.exec(content)) !== null) {
      const prefix = match[1] || "";
      const tagWithHash = match[2] || "";
      if (!tagWithHash) continue;

      const startIndex = match.index + prefix.length;
      const endIndex = startIndex + tagWithHash.length;
      const tag = tagWithHash.slice(1).toLowerCase();

      hashtags.push({ tag, startIndex, endIndex });
    }

    return hashtags;
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
