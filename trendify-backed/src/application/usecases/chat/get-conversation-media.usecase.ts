import { IMessageRepository, IConversationRepository } from "@/domain/chat";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { EVariantType } from "@/domain/media";
import { MessageModel } from "@/infrastructure/database/models/message.model";
import { Types } from "mongoose";
import * as Response from "@/shared/responses";

export type TMediaType = "image" | "video" | "file" | "all";

export class GetConversationMediaUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(params: {
    userId: string;
    conversationId: string;
    type?: TMediaType;
    limit?: number;
    cursor?: string;
  }) {
    const { userId, conversationId, type = "all", limit = 30, cursor } = params;

    // Auth check
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.isMember(userId)) throw new Response.ForbiddenError("Access denied");

    // Build mimeType filter
    const mimeFilter = this.buildMimeFilter(type);

    // Find messages that have mediaIds in this conversation
    const query: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
      mediaIds: { $exists: true, $not: { $size: 0 } },
      isUnsent: false,
      deletedFor: { $ne: new Types.ObjectId(userId) },
    };
    if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

    const messages = await MessageModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = messages.length > limit;
    const sliced = hasNext ? messages.slice(0, limit) : messages;

    // Collect all mediaIds
    const allMediaIds: string[] = sliced.flatMap((m: any) =>
      (m.mediaIds ?? []).map((id: Types.ObjectId) => id.toString()),
    );

    if (allMediaIds.length === 0) {
      return {
        items: [],
        cursor: null,
        hasNext: false,
      };
    }

    const mediaEntities = await this.mediaRepo.findByIds(allMediaIds);

    // Filter by type and build result
    const items = mediaEntities
      .filter((media) => {
        if (type === "all") return true;
        if (type === "image") return media.mimeType.startsWith("image/");
        if (type === "video") return media.mimeType.startsWith("video/");
        if (type === "file")
          return (
            !media.mimeType.startsWith("image/") && !media.mimeType.startsWith("video/")
          );
        return true;
      })
      .filter((media) => media.isReady() || media.isVideo())
      .map((media) => {
        const originalUrl = this.fileStorageService.getPublicUrl(media.key);
        const smallVariant = media.variants.find((v) => v.type === EVariantType.SMALL);
        const mediumVariant = media.variants.find((v) => v.type === EVariantType.MEDIUM);
        const thumbnailUrl = smallVariant
          ? this.fileStorageService.getPublicUrl(smallVariant.key)
          : mediumVariant
            ? this.fileStorageService.getPublicUrl(mediumVariant.key)
            : originalUrl;

        return {
          id: media.id!,
          url: originalUrl,
          thumbnailUrl,
          mimeType: media.mimeType,
          type: media.mimeType.startsWith("image/")
            ? "image"
            : media.mimeType.startsWith("video/")
              ? "video"
              : "file",
          size: media.size,
          fileName: (media.data as any).originalFilename ?? media.id,
        };
      });

    const nextCursor = hasNext ? sliced[sliced.length - 1]._id.toString() : null;

    return {
      items,
      cursor: nextCursor,
      hasNext,
    };
  }

  private buildMimeFilter(type: TMediaType): Record<string, unknown> | null {
    if (type === "image") return { $regex: "^image/" };
    if (type === "video") return { $regex: "^video/" };
    return null;
  }
}
