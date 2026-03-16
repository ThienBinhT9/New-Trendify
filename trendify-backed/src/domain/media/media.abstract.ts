import { MediaEntity } from "./media.entity";
import { EMediaPurpose, EMediaStatus, IMediaVariant } from "./media.type";

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export interface FindMediaByUserOptions {
  userId: string;
  purpose?: EMediaPurpose;
  status?: EMediaStatus;
  limit?: number;
  cursor?: string;
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface IMediaRepository {
  // CRUD
  create(media: MediaEntity): Promise<MediaEntity>;
  save(media: MediaEntity): Promise<void>;
  deleteById(mediaId: string): Promise<void>;
  deleteByIds(mediaIds: string[]): Promise<void>;

  // Queries
  findById(mediaId: string): Promise<MediaEntity | null>;
  findByKey(key: string): Promise<MediaEntity | null>;
  findByIds(mediaIds: string[]): Promise<MediaEntity[]>;
  findByUser(options: FindMediaByUserOptions): Promise<MediaEntity[]>;

  // Status updates
  updateStatus(mediaId: string, status: EMediaStatus): Promise<void>;
  addVariants(mediaId: string, variants: IMediaVariant[]): Promise<void>;

  // Cleanup
  findExpiredPending(limit?: number): Promise<MediaEntity[]>;
  deleteExpiredPending(): Promise<number>;
}
