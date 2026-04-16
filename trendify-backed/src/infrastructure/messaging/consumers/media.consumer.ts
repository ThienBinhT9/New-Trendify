import sharp from "sharp";
import path from "path";
import fs from "fs";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

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
  VIDEO_LIMITS,
} from "@/domain/media";

// Set ffmpeg binary path from ffmpeg-static
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Media Consumer - Xử lý image/video processing sau khi user upload lên S3
 *
 * Flow:
 * 1. Nhận message "media.process" từ RabbitMQ
 * 2. Download original từ S3
 * 3. Image: Resize thành các variants bằng sharp
 *    Video: Transcode bằng ffmpeg, tạo thumbnail
 * 4. Upload variants lên S3
 * 5. Cập nhật status MediaEntity → PROCESSED
 */
export class MediaConsumer extends BaseConsumer {
  private readonly mediaRepo: MongooseMediaRepository;
  private readonly storageSvc: S3Service;

  constructor() {
    const config: ConsumerConfig = {
      queueName: "media.queue",
      prefetch: 3,
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
      const isVideo = mimeType.startsWith("video/");
      const result = isVideo
        ? await this.processVideo(key, purpose, mimeType)
        : await this.processImage(key, purpose, mimeType);

      media.markProcessed(result.variants, result.metadata);
      await this.mediaRepo.save(media);

      console.log(
        `Media processed: ${mediaId} (${isVideo ? "video" : "image"}, ${result.variants.length} variants)`,
      );
    } catch (error) {
      console.error(`Media processing failed: ${mediaId}`, error);
      await this.mediaRepo.updateStatus(mediaId, EMediaStatus.FAILED);
      throw error; // trigger retry
    }
  }

  // ===========================================================================
  // IMAGE PROCESSING (existing logic, unchanged)
  // ===========================================================================

  private async processImage(
    originalKey: string,
    purpose: EMediaPurpose,
    _mimeType: string,
  ): Promise<{ variants: IMediaVariant[]; metadata: IMediaMetadata }> {
    // 1. Verify file exists on S3
    const headResult = await this.storageSvc.headObject(originalKey);
    if (!headResult) {
      throw new Error(`Original file not found on S3: ${originalKey}`);
    }

    // 2. Download original directly from S3
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

  // ===========================================================================
  // VIDEO PROCESSING
  // ===========================================================================

  private async processVideo(
    originalKey: string,
    _purpose: EMediaPurpose,
    _mimeType: string,
  ): Promise<{ variants: IMediaVariant[]; metadata: IMediaMetadata }> {
    // 1. Verify file exists on S3
    const headResult = await this.storageSvc.headObject(originalKey);
    if (!headResult) {
      throw new Error(`Original file not found on S3: ${originalKey}`);
    }

    // 2. Download original to temp file (ffmpeg needs file path, not buffer)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trendify-video-"));
    const ext = path.extname(originalKey) || ".mp4";
    const tmpInput = path.join(tmpDir, `input${ext}`);
    const tmpThumbnail = path.join(tmpDir, "thumbnail.jpg");
    const tmpTranscoded = path.join(tmpDir, "transcoded.mp4");

    try {
      const buffer = await this.storageSvc.downloadBuffer(originalKey);
      fs.writeFileSync(tmpInput, buffer);

      // 3. Probe video metadata
      const probeData = await this.probeVideo(tmpInput);
      const videoStream = probeData.streams.find((s) => s.codec_type === "video");

      if (!videoStream) {
        throw new Error("No video stream found in uploaded file");
      }

      const duration = parseFloat(String(probeData.format.duration ?? 0));
      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      const codec = videoStream.codec_name || "unknown";

      // 4. Validate duration
      if (duration > VIDEO_LIMITS.maxDuration) {
        throw new Error(
          `Video duration ${duration.toFixed(1)}s exceeds maximum ${VIDEO_LIMITS.maxDuration}s`,
        );
      }

      const metadata: IMediaMetadata = {
        width,
        height,
        duration: Math.round(duration),
        format: probeData.format.format_name?.split(",")[0],
        codec,
      };

      const variants: IMediaVariant[] = [];

      // 5. Add original as variant
      variants.push({
        key: originalKey,
        type: EVariantType.ORIGINAL,
        width,
        height,
        size: headResult.contentLength,
        format: ext.replace(".", ""),
      });

      // 6. Generate thumbnail at 1s mark
      const thumbnailTimestamp = Math.min(VIDEO_LIMITS.thumbnailTimestamp, duration * 0.5);
      await this.generateThumbnail(tmpInput, tmpThumbnail, thumbnailTimestamp);

      if (fs.existsSync(tmpThumbnail)) {
        // Optimize thumbnail with sharp
        const thumbBuffer = await sharp(tmpThumbnail)
          .resize(720, 720, { fit: "cover", position: "center" })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbKey = this.buildVariantKey(originalKey, EVariantType.SMALL, ".jpg");
        await this.storageSvc.uploadBuffer(thumbBuffer, thumbKey, "image/jpeg");

        const thumbMeta = await sharp(thumbBuffer).metadata();
        variants.push({
          key: thumbKey,
          type: EVariantType.SMALL,
          width: thumbMeta.width,
          height: thumbMeta.height,
          size: thumbBuffer.length,
          format: "jpeg",
        });
      }

      // 7. Transcode to 720p MP4 (H.264 + AAC) as MEDIUM variant
      //    Skip transcoding if original is already ≤ 720p and small enough
      const needsTranscode =
        width > VIDEO_LIMITS.transcodedWidth || height > VIDEO_LIMITS.transcodedHeight;

      if (needsTranscode) {
        await this.transcodeVideo(tmpInput, tmpTranscoded, width, height);

        if (fs.existsSync(tmpTranscoded)) {
          const transcodedBuffer = fs.readFileSync(tmpTranscoded);
          const transcodedKey = this.buildVariantKey(originalKey, EVariantType.MEDIUM, ".mp4");
          await this.storageSvc.uploadBuffer(transcodedBuffer, transcodedKey, "video/mp4");

          // Probe transcoded video for dimensions
          const transProbe = await this.probeVideo(tmpTranscoded);
          const transStream = transProbe.streams.find((s) => s.codec_type === "video");

          variants.push({
            key: transcodedKey,
            type: EVariantType.MEDIUM,
            width: transStream?.width || VIDEO_LIMITS.transcodedWidth,
            height: transStream?.height,
            size: transcodedBuffer.length,
            format: "mp4",
          });
        }
      }

      return { variants, metadata };
    } finally {
      // Cleanup temp files
      this.cleanupTmpDir(tmpDir);
    }
  }

  // ===========================================================================
  // FFMPEG HELPERS
  // ===========================================================================

  /**
   * Probe video file for metadata (duration, resolution, codec, etc.)
   */
  private probeVideo(filePath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }

  /**
   * Generate a thumbnail image from a video at a specific timestamp
   */
  private generateThumbnail(
    inputPath: string,
    outputPath: string,
    timestampSec: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(timestampSec)
        .frames(1)
        .output(outputPath)
        .outputOptions(["-vf", "scale=720:-2", "-q:v", "2"])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  }

  /**
   * Transcode video to 720p MP4 (H.264 + AAC)
   * Uses 2-pass-like CRF encoding for optimal quality/size ratio
   */
  private transcodeVideo(
    inputPath: string,
    outputPath: string,
    originalWidth: number,
    originalHeight: number,
  ): Promise<void> {
    // Calculate scaled dimensions maintaining aspect ratio
    // Scale to fit within 720p while keeping aspect ratio
    const isPortrait = originalHeight > originalWidth;
    const scaleFilter = isPortrait
      ? `scale=-2:${VIDEO_LIMITS.transcodedHeight}` // Portrait: limit height
      : `scale=${VIDEO_LIMITS.transcodedWidth}:-2`; // Landscape: limit width

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions([
          "-crf",
          "23", // Constant Rate Factor — good quality/size balance
          "-preset",
          "fast", // Encoding speed preset
          "-movflags",
          "+faststart", // Enable progressive playback
          "-vf",
          scaleFilter,
          "-b:a",
          VIDEO_LIMITS.audioBitrate,
          "-maxrate",
          VIDEO_LIMITS.transcodedBitrate,
          "-bufsize",
          "3000k",
          "-pix_fmt",
          "yuv420p", // Maximum compatibility
        ])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private buildVariantKey(
    originalKey: string,
    variantType: EVariantType,
    overrideExt?: string,
  ): string {
    const ext = path.extname(originalKey);
    const base = originalKey.slice(0, -ext.length);
    const finalExt = overrideExt || ".webp";
    return `${base}_${variantType}${finalExt}`;
  }

  /**
   * Recursively remove temp directory and all its contents
   */
  private cleanupTmpDir(dirPath: string): void {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to cleanup temp dir ${dirPath}:`, err);
    }
  }
}
