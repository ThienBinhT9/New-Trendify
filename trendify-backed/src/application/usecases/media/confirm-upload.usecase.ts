import * as Response from "@/shared/responses";
import { ConfirmUploadDTO, MediaResponseDTO } from "@/application/dtos/media.dto";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { IMessageProducer } from "@/application/services/message-producer.service";
import { ROUTING_KEYS } from "@/domain/events/message.type";

export class ConfirmUploadUseCase {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
    private readonly producerSvc: IMessageProducer,
  ) {}

  async execute(dto: ConfirmUploadDTO): Promise<Response.SuccessResponse<MediaResponseDTO>> {
    const { userId, mediaId } = dto;

    // 1. Find media record
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) {
      throw new Response.NotFoundError("Media not found");
    }

    // 2. Verify ownership
    if (!media.isOwnedBy(userId)) {
      throw new Response.ForbiddenError("You do not own this media");
    }

    // 3. Verify current status
    if (!media.isPendingUpload()) {
      throw new Response.BadRequestError(`Media already confirmed (status: ${media.status})`);
    }

    // 4. Check if expired
    if (media.isExpired()) {
      throw new Response.BadRequestError("Upload URL has expired. Please request a new one.");
    }

    // 5. Verify file actually exists on S3
    const headResult = await this.storageSvc.headObject(media.key);
    if (!headResult) {
      throw new Response.BadRequestError(
        "File not found on storage. Please upload the file using the presigned URL first.",
      );
    }

    // 6. Update media status to uploaded
    media.markUploaded(headResult.contentLength);
    await this.mediaRepo.save(media);

    // 7. Dispatch processing job
    await this.producerSvc.publish(ROUTING_KEYS.PROCESS_MEDIA, {
      mediaId: media.id!,
      key: media.key,
      purpose: media.purpose,
      mimeType: media.mimeType,
      bucket: media.bucket,
    });

    // 8. Return response
    const url = this.storageSvc.getPublicUrl(media.key);

    return new Response.SuccessResponse({
      data: {
        id: media.id!,
        url,
        status: media.status,
        purpose: media.purpose,
        mimeType: media.mimeType,
        size: media.size,
        variants: media.variants.map((v) => ({
          type: v.type,
          url: this.storageSvc.getPublicUrl(v.key),
          width: v.width,
          height: v.height,
        })),
      },
      message: "Upload confirmed. Media is being processed.",
    });
  }
}
