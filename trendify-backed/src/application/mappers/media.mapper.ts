import { EMediaStatus, EVariantType, IMediaMetadata, MediaEntity } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { EPostType } from "@/domain/post";
import * as Response from "@/shared/responses";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface MediaVariantDTO {
  type: EVariantType;
  url: string;
  width?: number;
  height?: number;
  size: number;
  format: string;
}

export interface MediaDTO {
  id: string;
  purpose: string;
  mimeType: string;
  status: EMediaStatus;
  variants: MediaVariantDTO[];
  metadata?: Readonly<IMediaMetadata>;
}

export type MediaVariantMap = Partial<Record<EVariantType, string>>;

export class MediaMapper {
  static toDTO(media: MediaEntity, fileStorageService: IFileStorageService): MediaDTO {
    if (!media.id) {
      throw new Error("Cannot map MediaEntity without id");
    }

    return {
      id: media.id,
      purpose: media.data.purpose,
      mimeType: media.mimeType,
      status: media.status,
      variants: MediaMapper.toVariantDTOList(media.variants, fileStorageService),
      metadata: media.metadata,
    };
  }

  static toVariantMap(
    media: MediaEntity,
    fileStorageService: IFileStorageService,
  ): MediaVariantMap {
    const urls = resolveVariantUrls(media, fileStorageService);
    return urls as MediaVariantMap;
  }

  static resolveVariantMap(
    mediaId: string | undefined,
    mediaMap: Record<string, MediaEntity>,
    fileStorageService: IFileStorageService,
  ): MediaVariantMap | undefined {
    if (!mediaId) return undefined;
    const media = mediaMap[mediaId];
    if (!media || !media.isReady()) return undefined;
    return MediaMapper.toVariantMap(media, fileStorageService);
  }

  static toVariantDTOList(
    variants: MediaEntity["variants"],
    fileStorageService: IFileStorageService,
  ): MediaVariantDTO[] {
    return variants.map((v) => ({
      type: v.type,
      url: fileStorageService.getPublicUrl(v.key),
      width: v.width,
      height: v.height,
      size: v.size,
      format: v.format,
    }));
  }
}

// ---------------------------------------------------------------------------
// Resolved shapes — one per use-case, all derived from the same helpers
// ---------------------------------------------------------------------------

/** Minimal resolved URL — for avatars, thumbnails, any single-image use-case */
export interface ResolvedMediaUrl {
  url: string;
  width?: number;
  height?: number;
}

/** Full variant map — { original, SMALL, MEDIUM, LARGE, … } -> url */
export type MediaVariantUrls = Record<string, string>;

/** Rich display object used wherever a post/comment/chat attachment is rendered */
export interface MediaDisplay {
  mediaId: string;
  url: string;
  type: "image" | "video" | "gif";
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  order: number;
  variants: MediaVariantUrls;
}

// ---------------------------------------------------------------------------
// Preset config — drives which variant is preferred per module
// ---------------------------------------------------------------------------

export type MediaModulePreset = "post" | "comment" | "chat" | "avatar";

export interface MediaResolverPreset {
  includeVariants: boolean;
  includeThumbnail: boolean;
  preferredVariant: EVariantType;
}

export const MEDIA_PRESETS: Record<MediaModulePreset, MediaResolverPreset> = {
  post: {
    includeVariants: true,
    includeThumbnail: true,
    preferredVariant: EVariantType.MEDIUM,
  },
  comment: {
    includeVariants: false,
    includeThumbnail: false,
    preferredVariant: EVariantType.SMALL,
  },
  chat: {
    includeVariants: true,
    includeThumbnail: true,
    preferredVariant: EVariantType.SMALL,
  },
  avatar: {
    includeVariants: false,
    includeThumbnail: false,
    preferredVariant: EVariantType.SMALL,
  },
};

/** Build a full variant-url map for one media entity */
export function resolveVariantUrls(
  media: MediaEntity,
  storageSvc: IFileStorageService,
): MediaVariantUrls {
  const urls: MediaVariantUrls = {
    original: storageSvc.getPublicUrl(media.key),
  };

  for (const variant of media.variants) {
    urls[variant.type] = storageSvc.getPublicUrl(variant.key);
  }

  return urls;
}

/** Resolve a single preferred URL, falling back to original */
export function resolvePreferredUrl(
  media: MediaEntity,
  storageSvc: IFileStorageService,
  preferredVariant: EVariantType,
): string {
  const preferred = media.variants.find((v) => v.type === preferredVariant);
  return storageSvc.getPublicUrl(preferred ? preferred.key : media.key);
}

/** Infer display type from mime */
export function getMediaDisplayType(mimeType: string): "image" | "video" | "gif" {
  if (mimeType === "image/gif") return "gif";
  if (mimeType.startsWith("video/")) return "video";
  return "image";
}

/** Map a single MediaEntity → MediaDisplay */
export function toMediaDisplay(
  media: MediaEntity,
  storageSvc: IFileStorageService,
  order: number,
): MediaDisplay {
  const type = getMediaDisplayType(media.mimeType);
  const thumbnail =
    type === "video" ? storageSvc.getPublicUrl(media.variants[0]?.key ?? media.key) : undefined;

  return {
    mediaId: media.id!,
    url: storageSvc.getPublicUrl(media.key),
    type,
    thumbnail,
    width: media.metadata?.width,
    height: media.metadata?.height,
    duration: media.metadata?.duration,
    order,
    variants: resolveVariantUrls(media, storageSvc),
  };
}

/** Map a single MediaEntity → ResolvedMediaUrl (lightweight, for avatars etc.) */
export function toResolvedUrl(
  media: MediaEntity,
  storageSvc: IFileStorageService,
  preferredVariant: EVariantType = EVariantType.SMALL,
): ResolvedMediaUrl {
  return {
    url: resolvePreferredUrl(media, storageSvc, preferredVariant),
    width: media.metadata?.width,
    height: media.metadata?.height,
  };
}

// ---------------------------------------------------------------------------
// Record helpers — dedup + batch fetch
// ---------------------------------------------------------------------------

/** Index an array of MediaEntity by id */
export function toMediaRecord(mediaEntities: MediaEntity[]): Record<string, MediaEntity> {
  return mediaEntities.reduce<Record<string, MediaEntity>>((acc, media) => {
    if (media.id) acc[media.id] = media;
    return acc;
  }, {});
}

/**
 * Batch-fetch a flat list of ids → Record<id, MediaEntity>
 * Handles dedup internally.
 */
export async function fetchMediaRecord(
  mediaIds: ReadonlyArray<string | undefined>,
  findByIds: (ids: string[]) => Promise<MediaEntity[]>,
): Promise<Record<string, MediaEntity>> {
  const unique = [...new Set(mediaIds.filter((id): id is string => typeof id === "string"))];
  if (unique.length === 0) return {};
  const entities = await findByIds(unique);
  return toMediaRecord(entities);
}

/**
 * Same as fetchMediaRecord but accepts multiple groups (e.g. post ids + author avatar id).
 * All groups are merged + deduped before the single DB call.
 */
export async function fetchMediaRecordFromGroups(
  groups: ReadonlyArray<ReadonlyArray<string | undefined>>,
  findByIds: (ids: string[]) => Promise<MediaEntity[]>,
): Promise<Record<string, MediaEntity>> {
  return fetchMediaRecord(groups.flat(), findByIds);
}

// ---------------------------------------------------------------------------
// High-level resolvers — use these in query handlers / use-cases
// ---------------------------------------------------------------------------

/**
 * Resolve a single optional media id → MediaVariantUrls | undefined.
 * Use for profile pictures, comment attachments, chat images.
 */
export function resolveMediaVariants(
  mediaId: string | undefined,
  mediaRecord: Record<string, MediaEntity>,
  storageSvc: IFileStorageService,
): MediaVariantUrls | undefined {
  if (!mediaId) return undefined;
  const media = mediaRecord[mediaId];
  if (!media?.isReady()) return undefined;
  return resolveVariantUrls(media, storageSvc);
}

/**
 * Resolve a single optional media id → preferred URL (e.g. avatar).
 */
export function resolveMediaUrl(
  mediaId: string | undefined,
  mediaRecord: Record<string, MediaEntity>,
  storageSvc: IFileStorageService,
  preferredVariant: EVariantType = EVariantType.SMALL,
): string | undefined {
  if (!mediaId) return undefined;
  const media = mediaRecord[mediaId];
  if (!media?.isReady()) return undefined;
  return resolvePreferredUrl(media, storageSvc, preferredVariant);
}

/**
 * Resolve an ordered list of media ids → MediaDisplay[].
 * Use for post/comment/chat attachment lists.
 */
export function resolveMediaDisplayList(
  mediaIds: readonly string[],
  mediaRecord: Record<string, MediaEntity>,
  storageSvc: IFileStorageService,
): MediaDisplay[] {
  return mediaIds.flatMap((id, order) => {
    const media = mediaRecord[id];
    if (!media?.isReady()) return [];
    return [toMediaDisplay(media, storageSvc, order)];
  });
}

// ---------------------------------------------------------------------------
// Batch population helper — one DB call for N parent objects
// ---------------------------------------------------------------------------

/**
 * Given a list of objects that each carry mediaIds, resolve all MediaDisplays
 * in a single DB round-trip.
 *
 * @example
 * const map = await batchResolveMediaDisplays(posts, storageSvc, repo.findByIds);
 * const postMedia = map.get(post.id) ?? [];
 */
export async function batchResolveMediaDisplays(
  items: { id: string; mediaIds: readonly string[] }[],
  storageSvc: IFileStorageService,
  findByIds: (ids: string[]) => Promise<MediaEntity[]>,
): Promise<Map<string, MediaDisplay[]>> {
  const allIds = [...new Set(items.flatMap((i) => i.mediaIds))];
  const mediaRecord = allIds.length > 0 ? toMediaRecord(await findByIds(allIds)) : {};

  return new Map(
    items.map((item) => [item.id, resolveMediaDisplayList(item.mediaIds, mediaRecord, storageSvc)]),
  );
}

// ---------------------------------------------------------------------------
// Validation helper — used in write use-cases (create post, send message, …)
// ---------------------------------------------------------------------------

/**
 * Fetch, validate ownership + readiness for a list of media ids.
 * Throws typed HTTP errors on any violation.
 * Returns entities in the same order as the input ids.
 */
export async function validateAndFetchMedia(
  mediaIds: string[],
  userId: string,
  findByIds: (ids: string[]) => Promise<MediaEntity[]>,
): Promise<MediaEntity[]> {
  if (mediaIds.length === 0) return [];

  const entities = await findByIds(mediaIds);

  if (entities.length !== mediaIds.length) {
    throw new Response.NotFoundError("One or more media files not found");
  }

  const mediaRecord = toMediaRecord(entities);

  return mediaIds.map((id) => {
    const media = mediaRecord[id]!;

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

    return media;
  });
}

// ---------------------------------------------------------------------------
// Domain helper
// ---------------------------------------------------------------------------

export function determinePostType(mediaEntities: MediaEntity[]): EPostType {
  if (mediaEntities.length === 0) return EPostType.TEXT;
  const hasVideo = mediaEntities.some((m) => m.mimeType.startsWith("video/"));
  return hasVideo ? EPostType.VIDEO : EPostType.IMAGE;
}
