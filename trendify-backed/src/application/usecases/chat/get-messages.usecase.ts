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
    // Resolve mediaIds to URLs, and get replyTo messages
    const allMediaIds = messages.flatMap((msg) => msg.mediaIds || []);
    const uniqueReplyToIds = [...new Set(messages.map((m) => m.replyToId).filter(Boolean) as string[])];
    
    const [mediaUrlMap, replyToEntities] = await Promise.all([
      (async () => {
        const map = new Map<string, string>();
        if (allMediaIds.length > 0 && this.mediaRepo && this.fileStorageService) {
          const uniqueIds = [...new Set(allMediaIds)];
          const mediaEntities = await this.mediaRepo.findByIds(uniqueIds);
          for (const media of mediaEntities) {
            if (media.id && media.key) {
              map.set(media.id, this.fileStorageService.getPublicUrl(media.key));
            }
          }
        }
        return map;
      })(),
      (async () => {
        if (uniqueReplyToIds.length > 0) return this.messageRepo.findByIds(uniqueReplyToIds);
        return [];
      })(),
    ]);

    const replyToMap = new Map(replyToEntities.map((m) => [m.id, m]));

    const items = await Promise.all(
      messages.map(async (msg) => {
        let sender = undefined;
        if (msg.senderId) {
          const user = await this.userRepo.findById(msg.senderId);
          if (user) {
            sender = {
              id: user.id,
              username: user.data.username,
              displayName: (user.id && conversation.settings?.nicknames?.[user.id]) || user.fullName || `${user.data.firstName} ${user.data.lastName}`,
              profilePicture: user.data.profilePicture
                ? { mediaId: user.data.profilePicture }
                : null,
            };
          }
        }

        let replyTo = undefined;
        if (msg.replyToId) {
          const repliedMsg = replyToMap.get(msg.replyToId);
          if (repliedMsg) {
            let replyToSender = undefined;
            if (repliedMsg.senderId) {
              const u = await this.userRepo.findById(repliedMsg.senderId);
              if (u) {
                replyToSender = {
                  id: u.id,
                  displayName: (u.id && conversation.settings?.nicknames?.[u.id]) || u.fullName || `${u.data.firstName} ${u.data.lastName}`,
                };
              }
            }
            replyTo = {
              id: repliedMsg.id,
              content: repliedMsg.content,
              type: repliedMsg.type,
              senderId: repliedMsg.senderId,
              sender: replyToSender,
              mediaIds: repliedMsg.mediaIds,
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
          reactions: msg.reactions,
          replyToId: msg.replyToId,
          replyTo,
          forwardedFromId: msg.forwardedFromId,
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
