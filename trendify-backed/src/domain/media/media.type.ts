// ============================================================================
// ENUMS
// ============================================================================

export enum EMediaPurpose {
  PROFILE_PICTURE = "profile-picture",
  COVER_PICTURE = "cover-picture",
  POST_MEDIA = "post-media",
}

export enum EMediaStatus {
  PENDING_UPLOAD = "pending_upload",
  UPLOADED = "uploaded",
  PROCESSING = "processing",
  PROCESSED = "processed",
  FAILED = "failed",
}

// ============================================================================
// VARIANT TYPES
// ============================================================================

export enum EVariantType {
  ORIGINAL = "original",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
}

export interface IMediaVariant {
  key: string;
  type: EVariantType;
  width?: number;
  height?: number;
  size: number;
  format: string; // e.g. "jpeg", "webp", "mp4"
}

// ============================================================================
// MEDIA LIMITS
// ============================================================================

export interface IMediaLimits {
  maxSize: number; // bytes
  allowedMimeTypes: string[];
  variants: EVariantType[];
}

/**
 * Per-purpose upload limits and processing config
 */
export const MEDIA_LIMITS: Record<EMediaPurpose, IMediaLimits> = {
  [EMediaPurpose.PROFILE_PICTURE]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    variants: [EVariantType.SMALL, EVariantType.MEDIUM],
  },
  [EMediaPurpose.COVER_PICTURE]: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    variants: [],
  },
  [EMediaPurpose.POST_MEDIA]: {
    maxSize: 50 * 1024 * 1024, // 50MB (videos can be large)
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ],
    variants: [EVariantType.MEDIUM, EVariantType.LARGE],
  },
};

/**
 * Variant dimension config for image processing
 */
export const VARIANT_DIMENSIONS: Record<
  EVariantType,
  Record<string, { width: number; height: number }>
> = {
  [EVariantType.ORIGINAL]: {},
  [EVariantType.SMALL]: {
    [EMediaPurpose.PROFILE_PICTURE]: { width: 150, height: 150 },
    default: { width: 240, height: 240 },
  },
  [EVariantType.MEDIUM]: {
    [EMediaPurpose.PROFILE_PICTURE]: { width: 400, height: 400 },
    [EMediaPurpose.COVER_PICTURE]: { width: 820, height: 312 },
    default: { width: 720, height: 720 },
  },
  [EVariantType.LARGE]: {
    [EMediaPurpose.COVER_PICTURE]: { width: 1640, height: 624 },
    [EMediaPurpose.POST_MEDIA]: { width: 1080, height: 1080 },
    default: { width: 1080, height: 1080 },
  },
};

// ============================================================================
// MAIN INTERFACE
// ============================================================================

export interface IMediaProps {
  userId: string;
  key: string;
  bucket: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  purpose: EMediaPurpose;
  status: EMediaStatus;
  variants: IMediaVariant[];
  metadata?: IMediaMetadata;
  expiresAt?: Date; // TTL for pending uploads
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // video duration in seconds
  format?: string;
  codec?: string;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface IMediaCreateInput {
  userId: string;
  key: string;
  bucket: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  purpose: EMediaPurpose;
}
