import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config();

/**
 * S3 Configuration
 * Supports AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces
 * Set S3_ENDPOINT for S3-compatible providers (R2, MinIO, etc.)
 */
const s3Config = {
  bucket: process.env.S3_BUCKET!,
  region: process.env.S3_REGION || "p-southeast-1",
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  endpoint: process.env.S3_ENDPOINT || undefined, // Custom endpoint for R2/MinIO
  cdnDomain: process.env.S3_CDN_DOMAIN || undefined, // CloudFront/CDN domain
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // true for MinIO
  presignedUrlExpiry: Number(process.env.S3_PRESIGNED_URL_EXPIRY) || 900, // 15 minutes
};

/**
 * S3 Client singleton
 * Provider-agnostic: works with AWS S3, Cloudflare R2, MinIO, etc.
 */
export const s3Client = new S3Client({
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
  ...(s3Config.endpoint && { endpoint: s3Config.endpoint }),
  forcePathStyle: s3Config.forcePathStyle,
});

export default s3Config;
