import { IConversationRepository } from "@/domain/chat";
import { IUserRepository } from "@/domain/user/user.abstract";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";

export class GetConversationsUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(params: { userId: string; limit: number; cursor?: string; filter?: string }) {
    const { userId, limit, cursor, filter } = params;

    // Pass sorting/filtering to repo if supported, here using defaults
    const { conversations, nextCursor } = await this.conversationRepo.findByMember(userId, {
      limit,
      cursor,
    });

    // Gather user IDs and media IDs to batch fetch
    const userIdsToFetch = new Set<string>();
    const mediaIdsToFetch = new Set<string>();

    conversations.forEach((conv) => {
      if (conv.avatarMediaId) mediaIdsToFetch.add(conv.avatarMediaId);
      if (conv.type === "direct") {
        const otherMemberId = conv.getOtherMemberId(userId);
        if (otherMemberId) userIdsToFetch.add(otherMemberId);
      }
    });

    const [users, mediaEntities] = await Promise.all([
      this.userRepo.findByIds(Array.from(userIdsToFetch)),
      this.mediaRepo.findByIds(Array.from(mediaIdsToFetch)),
    ]);

    // Gather more media IDs from fetched users
    const userMediaIds = users.map(u => u.data.profilePicture as string).filter(Boolean);
    if (userMediaIds.length > 0) {
      const moreMedia = await this.mediaRepo.findByIds(userMediaIds);
      mediaEntities.push(...moreMedia);
    }

    const mediaRecord = mediaEntities.reduce((acc: any, media: any) => {
      acc[media.id] = media;
      return acc;
    }, {});

    const { MediaMapper } = await import("@/application/mappers/media.mapper");

    const items = await Promise.all(
      conversations.map(async (conv) => {
        let otherUser = undefined;

        if (conv.type === "direct") {
          const otherMemberId = conv.getOtherMemberId(userId);
          if (otherMemberId) {
            const user = users.find((u) => u.id === otherMemberId);
            if (user) {
              otherUser = {
                id: user.id,
                username: user.data.username,
                displayName: `${user.data.firstName} ${user.data.lastName}`,
                profilePicture: MediaMapper.resolveVariantMap(
                  user.data.profilePicture,
                  mediaRecord,
                  this.fileStorageService
                ),
              };
            }
          }
        }

        return {
          id: conv.id,
          type: conv.type,
          name: conv.name,
          members: conv.members,
          lastMessage: conv.lastMessage,
          isPinned: conv.isPinnedFor(userId),
          settings: conv.settings,
          avatarUrl: MediaMapper.resolveVariantMap(conv.avatarMediaId, mediaRecord, this.fileStorageService)?.small || null,
          unreadCount: 0, // Simplified for now
          updatedAt: conv.data.updatedAt?.toISOString(),
          otherUser,
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
