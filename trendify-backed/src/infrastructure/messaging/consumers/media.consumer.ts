import sharp from "sharp";
import path from "path";

import { BaseConsumer, ConsumerConfig } from "../consumer.base";
import { MediaProcessMessage, ROUTING_KEYS } from "@/domain/events";
import { MongooseMediaRepository } from "@/infrastructure/database/repositories/media.repository.impl";
import S3Service from "@/infrastructure/services/s3.service";
import {
  EMediaPurpose,
  EMediaStatus,
  EVariantType,
  IMediaVariant,
  IMediaMetadata,
  MEDIA_LIMITS,
  VARIANT_DIMENSIONS,
} from "@/domain/media";

/**
 * Media Consumer - Xử lý image processing sau khi user upload lên S3
 *
 * Flow:
 * 1. Nhận message "media.process" từ RabbitMQ
 * 2. Download original từ S3
 * 3. Resize thành các variants bằng sharp
 * 4. Upload variants lên S3
 * 5. Cập nhật status MediaEntity → PROCESSED
 */
export class MediaConsumer extends BaseConsumer {
  private readonly mediaRepo: MongooseMediaRepository;
  private readonly storageSvc: S3Service;

  constructor() {
    const config: ConsumerConfig = {
      queueName: "media.queue",
      prefetch: 3, // Xử lý 3 ảnh cùng lúc
      retryLimit: 3,
    };

    super(config);
    this.mediaRepo = new MongooseMediaRepository();
    this.storageSvc = new S3Service();
  }

  protected registerHandlers(): void {
    this.register<MediaProcessMessage["data"]>(
      ROUTING_KEYS.PROCESS_MEDIA,
      this.handleProcessMedia.bind(this),
    );
  }

  private async handleProcessMedia(data: MediaProcessMessage["data"]): Promise<void> {
    const { mediaId, key, purpose, mimeType } = data;

    const media = await this.mediaRepo.findById(mediaId);
    if (!media) {
      console.warn(`Media not found: ${mediaId}`);
      return;
    }

    if (!media.isUploaded()) {
      console.warn(`Media ${mediaId} not in uploaded state: ${media.status}`);
      return;
    }

    // Mark processing
    await this.mediaRepo.updateStatus(mediaId, EMediaStatus.PROCESSING);

    try {
      const result = await this.processImage(key, purpose, mimeType);
      media.markProcessed(result.variants, result.metadata);
      await this.mediaRepo.save(media);

      console.log(`Media processed: ${mediaId} (${result.variants.length} variants)`);
    } catch (error) {
      console.error(`Media processing failed: ${mediaId}`, error);
      await this.mediaRepo.updateStatus(mediaId, EMediaStatus.FAILED);
      throw error; // trigger retry
    }
  }

  private async processImage(
    originalKey: string,
    purpose: EMediaPurpose,
    _mineType: string,
  ): Promise<{ variants: IMediaVariant[]; metadata: IMediaMetadata }> {
    // 1. Verify file exists on S3
    const headResult = await this.storageSvc.headObject(originalKey);
    if (!headResult) {
      throw new Error(`Original file not found on S3: ${originalKey}`);
    }

    // 2. Download original directly from S3 (works with both public and private buckets)
    const buffer = await this.storageSvc.downloadBuffer(originalKey);

    // 3. Get metadata
    const imageMeta = await sharp(buffer).metadata();
    const metadata: IMediaMetadata = {
      width: imageMeta.width,
      height: imageMeta.height,
      format: imageMeta.format,
    };

    const limits = MEDIA_LIMITS[purpose];
    const variants: IMediaVariant[] = [];

    // 4. Add original as variant
    variants.push({
      key: originalKey,
      type: EVariantType.ORIGINAL,
      width: imageMeta.width,
      height: imageMeta.height,
      size: headResult.contentLength,
      format: imageMeta.format || "jpeg",
    });

    // 5. Generate resized variants as WebP
    for (const variantType of limits.variants) {
      const dimensionMap = VARIANT_DIMENSIONS[variantType];
      const dim = dimensionMap[purpose] || dimensionMap["default"];
      if (!dim) continue;

      const variantKey = this.buildVariantKey(originalKey, variantType);

      try {
        const resized = await sharp(buffer)
          .resize(dim.width, dim.height, { fit: "cover", position: "center" })
          .webp({ quality: 80 })
          .toBuffer();

        await this.storageSvc.uploadBuffer(resized, variantKey, "image/webp");

        const resizedMeta = await sharp(resized).metadata();
        variants.push({
          key: variantKey,
          type: variantType,
          width: resizedMeta.width,
          height: resizedMeta.height,
          size: resized.length,
          format: "webp",
        });
      } catch (err) {
        console.error(`Failed to generate variant ${variantType} for ${originalKey}:`, err);
      }
    }

    return { variants, metadata };
  }

  private buildVariantKey(originalKey: string, variantType: EVariantType): string {
    const ext = path.extname(originalKey);
    const base = originalKey.slice(0, -ext.length);
    return `${base}_${variantType}.webp`;
  }
}

//     const avatarUpload = useImageUploadCrop({
//   aspect: 1,
//   uploadAction: async (blob) => {
//     // Step 1: Presigned URL
//     const { mediaId, uploadUrl } = await api.post("/media/presigned-url", {
//       purpose: "profile-picture",
//       filename: "avatar.jpg",
//       contentType: blob.type,
//       size: blob.size,
//     });

//     // Step 2: Upload S3
//     await fetch(uploadUrl, {
//       method: "PUT",
//       body: blob,
//       headers: { "Content-Type": blob.type },
//     });

//     // Step 3: Confirm
//     await api.post("/media/confirm", { mediaId });

//     // Step 4: Save profile
//     await api.patch("/users/me", { profilePicture: mediaId });
//   },
//   reloadAction: async () => {
//     await refetchUser();
//   },
// });

//     2. Backend:
// ✅ RequestPresignedUrlUseCase — tạo MediaEntity, trả presigned URL
// ✅ ConfirmUploadUseCase — mark UPLOADED, publish PROCESS_MEDIA
// ✅ MediaConsumer — resize variants, mark PROCESSED
// ✅ UpdateProfileUseCase — validate mediaId, store vào user.profilePicture, cleanup old
// ✅ UserProfileUseCase + MyProfileUseCase — resolve mediaId → URL
