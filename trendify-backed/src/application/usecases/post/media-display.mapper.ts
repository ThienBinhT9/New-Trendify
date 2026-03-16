import { MediaEntity, EMediaStatus } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { EPostType } from "@/domain/post";
import * as Response from "@/shared/responses";

// ============================================================================
// TYPES
// ============================================================================

export interface PostMediaDisplay {
  mediaId: string;
  url: string;
  type: "image" | "video" | "gif";
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  order: number;
  variants: {
    type: string;
    url: string;
    width?: number;
    height?: number;
  }[];
}

// ============================================================================
// HELPERS
// ============================================================================

export function getMediaDisplayType(mimeType: string): "image" | "video" | "gif" {
  if (mimeType === "image/gif") return "gif";
  if (mimeType.startsWith("video/")) return "video";
  return "image";
}

export function determinePostType(mediaEntities: MediaEntity[]): EPostType {
  if (mediaEntities.length === 0) return EPostType.TEXT;
  const hasVideo = mediaEntities.some((m) => m.mimeType.startsWith("video/"));
  return hasVideo ? EPostType.VIDEO : EPostType.IMAGE;
}

export function mapMediaToDisplay(
  media: MediaEntity,
  storageSvc: IFileStorageService,
  order: number,
): PostMediaDisplay {
  const type = getMediaDisplayType(media.mimeType);

  // For videos, use the first variant (thumbnail) or the original key
  const thumbnail =
    type === "video"
      ? storageSvc.getPublicUrl(media.variants[0]?.key ?? media.key)
      : undefined;

  return {
    mediaId: media.id!,
    url: storageSvc.getPublicUrl(media.key),
    type,
    thumbnail,
    width: media.metadata?.width,
    height: media.metadata?.height,
    duration: media.metadata?.duration,
    order,
    variants: media.variants.map((v) => ({
      type: v.type,
      url: storageSvc.getPublicUrl(v.key),
      width: v.width,
      height: v.height,
    })),
  };
}

/**
 * Validates that media IDs exist, belong to the user, have correct purpose, and are ready.
 * Returns sorted MediaEntity[] by the order of mediaIds.
 */
export async function validateAndFetchMedia(
  mediaIds: string[],
  userId: string,
  {
    findByIds,
  }: {
    findByIds: (ids: string[]) => Promise<MediaEntity[]>;
  },
): Promise<MediaEntity[]> {
  if (mediaIds.length === 0) return [];

  if (mediaIds.length > 10) {
    throw new Response.BadRequestError("Maximum 10 media files per post");
  }

  const mediaEntities = await findByIds(mediaIds);

  // Check all IDs resolved
  if (mediaEntities.length !== mediaIds.length) {
    throw new Response.NotFoundError("One or more media files not found");
  }

  // Build a map to maintain the caller's ordering
  const mediaMap = new Map(mediaEntities.map((m) => [m.id!, m]));

  const orderedMedia: MediaEntity[] = [];
  for (const id of mediaIds) {
    const media = mediaMap.get(id)!;

    if (!media.isOwnedBy(userId)) {
      throw new Response.ForbiddenError("You do not own one or more of the media files");
    }

    if (media.status === EMediaStatus.FAILED) {
      throw new Response.BadRequestError(`Media ${id} failed to process`);
    }

    if (!media.isReady()) {
      throw new Response.BadRequestError(
        `Media ${id} is not ready yet (status: ${media.status}). Please wait for processing to complete.`,
      );
    }

    orderedMedia.push(media);
  }

  return orderedMedia;
}

/**
 * Populate media display for a list of (postId, mediaIds) pairs.
 * Batch-fetches all media in one query.
 */
export async function batchPopulateMedia(
  posts: { id: string; mediaIds: readonly string[] }[],
  storageSvc: IFileStorageService,
  findByIds: (ids: string[]) => Promise<MediaEntity[]>,
): Promise<Map<string, PostMediaDisplay[]>> {
  const allMediaIds = [...new Set(posts.flatMap((p) => p.mediaIds))];
  if (allMediaIds.length === 0) {
    return new Map(posts.map((p) => [p.id, []]));
  }

  const allMedia = await findByIds(allMediaIds);
  const mediaMap = new Map(allMedia.map((m) => [m.id!, m]));

  const result = new Map<string, PostMediaDisplay[]>();
  for (const post of posts) {
    const displays = post.mediaIds
      .map((id, order) => {
        const media = mediaMap.get(id);
        if (!media) return null;
        return mapMediaToDisplay(media, storageSvc, order);
      })
      .filter(Boolean) as PostMediaDisplay[];

    result.set(post.id, displays);
  }

  return result;
}
