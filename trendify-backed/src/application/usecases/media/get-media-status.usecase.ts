import * as Response from "@/shared/responses";
import { GetMediaStatusDTO, MediaResponseDTO } from "@/application/dtos/media.dto";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";

export class GetMediaStatusUseCase {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetMediaStatusDTO): Promise<Response.SuccessResponse<MediaResponseDTO>> {
    const { userId, mediaId } = dto;

    const media = await this.mediaRepo.findById(mediaId);
    if (!media) {
      throw new Response.NotFoundError("Media not found");
    }

    if (!media.isOwnedBy(userId)) {
      throw new Response.ForbiddenError("You do not own this media");
    }

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
      message: "Media status retrieved",
    });
  }
}
