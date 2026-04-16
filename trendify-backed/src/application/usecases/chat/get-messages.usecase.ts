import { IMessageRepository, IConversationRepository } from "@/domain/chat";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import * as Response from "@/shared/responses";

export class GetMessagesUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo?: IMediaRepository,
    private readonly fileStorageService?: IFileStorageService,
  ) {}

  async execute(params: {
    userId: string;
    conversationId: string;
    limit: number;
    cursor?: string;
  }) {
    const { userId, conversationId, limit, cursor } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");

    if (!conversation.isMember(userId)) {
      throw new Response.ForbiddenError("Access denied");
    }

    const { messages, nextCursor } = await this.messageRepo.findByConversation(conversationId, {
      limit,
      cursor,
      userId,
    });

    // Batch-resolve all mediaIds to URLs
    const allMediaIds = messages.flatMap((msg) => msg.mediaIds || []);
    const mediaUrlMap = new Map<string, string>();

    if (allMediaIds.length > 0 && this.mediaRepo && this.fileStorageService) {
      const uniqueIds = [...new Set(allMediaIds)];
      const mediaEntities = await this.mediaRepo.findByIds(uniqueIds);
      for (const media of mediaEntities) {
        if (media.id && media.key) {
          mediaUrlMap.set(media.id, this.fileStorageService.getPublicUrl(media.key));
        }
      }
    }

    const items = await Promise.all(
      messages.map(async (msg) => {
        let sender = undefined;
        if (msg.senderId) {
          const user = await this.userRepo.findById(msg.senderId);
          if (user) {
            sender = {
              id: user.id,
              username: user.data.username,
              displayName: user.fullName || `${user.data.firstName} ${user.data.lastName}`,
              profilePicture: user.data.profilePicture
                ? { mediaId: user.data.profilePicture }
                : null,
            };
          }
        }

        // Resolve mediaIds to URLs
        const mediaUrls = (msg.mediaIds || [])
          .map((id) => mediaUrlMap.get(id))
          .filter((url): url is string => !!url);

        return {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          type: msg.type,
          content: msg.content,
          mediaIds: msg.mediaIds,
          mediaUrls,
          isUnsent: msg.isUnsent,
          createdAt: msg.createdAt?.toISOString(),
          sender,
          isMine: msg.senderId === userId,
        };
      }),
    );

    return {
      items,
      cursor: nextCursor || null,
      hasNext: !!nextCursor,
    };
  }
}
