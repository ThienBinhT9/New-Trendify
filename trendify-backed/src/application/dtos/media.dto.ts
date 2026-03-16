import { EMediaPurpose, EMediaStatus, EVariantType, IMediaVariant } from "@/domain/media";

// ============================================================================
// REQUEST DTOs
// ============================================================================

export interface RequestPresignedUrlDTO {
  userId: string;
  purpose: EMediaPurpose;
  filename: string;
  contentType: string;
  size: number;
}

export interface ConfirmUploadDTO {
  userId: string;
  mediaId: string;
}

export interface GetMediaStatusDTO {
  userId: string;
  mediaId: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface PresignedUrlResponseDTO {
  uploadUrl: string;
  mediaId: string;
}

export interface MediaResponseDTO {
  id: string;
  url: string;
  status: EMediaStatus;
  purpose: EMediaPurpose;
  mimeType: string;
  size: number;
  variants: MediaVariantResponseDTO[];
}

export interface MediaVariantResponseDTO {
  type: EVariantType;
  url: string;
  width?: number;
  height?: number;
}
