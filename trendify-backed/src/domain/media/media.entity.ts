import {
  EMediaPurpose,
  EMediaStatus,
  IMediaCreateInput,
  IMediaMetadata,
  IMediaProps,
  IMediaVariant,
} from "./media.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class MediaEntity {
  private readonly props: IMediaProps;
  readonly id?: string;

  constructor(props: IMediaProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<IMediaProps> {
    return Object.freeze({ ...this.props });
  }

  get userId(): string {
    return this.props.userId;
  }

  get key(): string {
    return this.props.key;
  }

  get bucket(): string {
    return this.props.bucket;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get size(): number {
    return this.props.size;
  }

  get purpose(): EMediaPurpose {
    return this.props.purpose;
  }

  get status(): EMediaStatus {
    return this.props.status;
  }

  get variants(): readonly IMediaVariant[] {
    return Object.freeze([...this.props.variants]);
  }

  get metadata(): Readonly<IMediaMetadata> | undefined {
    return this.props.metadata ? Object.freeze({ ...this.props.metadata }) : undefined;
  }

  // --------------------------------------------------------------------------
  // Status Check Methods
  // --------------------------------------------------------------------------

  isPendingUpload(): boolean {
    return this.props.status === EMediaStatus.PENDING_UPLOAD;
  }

  isUploaded(): boolean {
    return this.props.status === EMediaStatus.UPLOADED;
  }

  isProcessing(): boolean {
    return this.props.status === EMediaStatus.PROCESSING;
  }

  isProcessed(): boolean {
    return this.props.status === EMediaStatus.PROCESSED;
  }

  isFailed(): boolean {
    return this.props.status === EMediaStatus.FAILED;
  }

  isReady(): boolean {
    return this.isUploaded() || this.isProcessed();
  }

  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  // --------------------------------------------------------------------------
  // Type Check Methods
  // --------------------------------------------------------------------------

  isImage(): boolean {
    return this.props.mimeType.startsWith("image/");
  }

  isVideo(): boolean {
    return this.props.mimeType.startsWith("video/");
  }

  isProfilePicture(): boolean {
    return this.props.purpose === EMediaPurpose.PROFILE_PICTURE;
  }

  isCoverPicture(): boolean {
    return this.props.purpose === EMediaPurpose.COVER_PICTURE;
  }

  isPostMedia(): boolean {
    return this.props.purpose === EMediaPurpose.POST_MEDIA;
  }

  // --------------------------------------------------------------------------
  // Mutation Methods
  // --------------------------------------------------------------------------

  markUploaded(actualSize?: number): void {
    if (this.props.status !== EMediaStatus.PENDING_UPLOAD) {
      throw new Error(`Cannot mark as uploaded: current status is ${this.props.status}`);
    }
    this.props.status = EMediaStatus.UPLOADED;
    if (actualSize !== undefined) {
      this.props.size = actualSize;
    }
    this.props.expiresAt = undefined; // Clear TTL once uploaded
    this.props.updatedAt = new Date();
  }

  markProcessing(): void {
    if (this.props.status !== EMediaStatus.UPLOADED) {
      throw new Error(`Cannot mark as processing: current status is ${this.props.status}`);
    }
    this.props.status = EMediaStatus.PROCESSING;
    this.props.updatedAt = new Date();
  }

  markProcessed(variants: IMediaVariant[], metadata?: IMediaMetadata): void {
    if (
      this.props.status !== EMediaStatus.PROCESSING &&
      this.props.status !== EMediaStatus.UPLOADED
    ) {
      throw new Error(`Cannot mark as processed: current status is ${this.props.status}`);
    }
    this.props.status = EMediaStatus.PROCESSED;
    this.props.variants = variants;
    if (metadata) {
      this.props.metadata = metadata;
    }
    this.props.updatedAt = new Date();
  }

  markFailed(): void {
    this.props.status = EMediaStatus.FAILED;
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  getAllKeys(): string[] {
    const keys = [this.props.key];
    for (const variant of this.props.variants) {
      keys.push(variant.key);
    }
    return keys;
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(input: IMediaCreateInput): MediaEntity {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes TTL for pending

    const props: IMediaProps = {
      userId: input.userId,
      key: input.key,
      bucket: input.bucket,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      size: input.size,
      purpose: input.purpose,
      status: EMediaStatus.PENDING_UPLOAD,
      variants: [],
      metadata: undefined,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    return new MediaEntity(props);
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId.toString() === userId;
  }
}
