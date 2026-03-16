import * as z from "zod";
import { EMediaPurpose, MEDIA_LIMITS } from "@/domain/media";

/**
 * All allowed MIME types across all purposes
 */
const ALL_ALLOWED_MIME_TYPES = [
  ...new Set(Object.values(MEDIA_LIMITS).flatMap((l) => l.allowedMimeTypes)),
];

/**
 * Schema for requesting a presigned upload URL
 */
export const requestPresignedUrlSchema = z.object({
  purpose: z.nativeEnum(EMediaPurpose, {
    error: () => ({
      message: `Purpose must be one of: ${Object.values(EMediaPurpose).join(", ")}`,
    }),
  }),
  filename: z
    .string()
    .trim()
    .min(1, { message: "Filename is required" })
    .max(255, { message: "Filename must be at most 255 characters" })
    .refine(
      (name) => /^[a-zA-Z0-9._\-\s()]+$/.test(name),
      { message: "Filename contains invalid characters" },
    ),
  contentType: z
    .string()
    .trim()
    .refine(
      (ct) => ALL_ALLOWED_MIME_TYPES.includes(ct),
      {
        message: `Content type must be one of: ${ALL_ALLOWED_MIME_TYPES.join(", ")}`,
      },
    ),
  size: z
    .number()
    .int()
    .positive({ message: "File size must be a positive number" })
    .max(100 * 1024 * 1024, { message: "File size must not exceed 100MB" }),
});

/**
 * Schema for confirming an upload
 */
export const confirmUploadSchema = z.object({
  mediaId: z.string().trim().min(1, { message: "Media ID is required" }),
});

/**
 * Schema for getting media status (params)
 */
export const getMediaStatusParamsSchema = z.object({
  mediaId: z.string().trim().min(1, { message: "Media ID is required" }),
});
