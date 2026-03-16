import * as Response from "@/shared/responses";
import { RequestPresignedUrlDTO, PresignedUrlResponseDTO } from "@/application/dtos/media.dto";
import { IMediaRepository, MediaEntity } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import s3Config from "@/infrastructure/configs/s3.config";
import path from "path";
import crypto from "crypto";

export class RequestPresignedUrlUseCase {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(
    dto: RequestPresignedUrlDTO,
  ): Promise<Response.SuccessResponse<PresignedUrlResponseDTO>> {
    const { userId, purpose, filename, contentType, size } = dto;

    // 1. Generate unique S3 key
    const ext = path.extname(filename) || this.mimeToExt(contentType);
    const uniqueId = crypto.randomUUID();
    const key = `${purpose}/${userId}/${uniqueId}${ext}`;

    // 2. Create media entity (pending status)
    const mediaEntity = MediaEntity.create({
      userId,
      key,
      bucket: s3Config.bucket,
      originalFilename: filename,
      mimeType: contentType,
      size,
      purpose,
    });

    const savedMedia = await this.mediaRepo.create(mediaEntity);

    // 3. Generate presigned URL
    const expiresIn = s3Config.presignedUrlExpiry;
    const { url } = await this.storageSvc.generatePresignedUploadUrl(key, contentType, expiresIn);

    return new Response.SuccessResponse({
      data: {
        uploadUrl: url,
        mediaId: savedMedia.id!,
      },
      message: "Presigned URL generated successfully",
    });
  }

  private mimeToExt(mimeType: string): string {
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    return map[mimeType] || ".bin";
  }
}
