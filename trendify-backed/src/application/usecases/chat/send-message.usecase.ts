import { IMessageRepository, IConversationRepository } from "@/domain/chat";
import { IBlockRepository } from "@/domain/block/block.abstract";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { MessageEntity } from "@/domain/chat/message.entity";
import { EMessageType } from "@/domain/chat/message.type";
import * as Response from "@/shared/responses";

export class SendMessageUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly blockRepo?: IBlockRepository,
    private readonly mediaRepo?: IMediaRepository,
    private readonly fileStorageService?: IFileStorageService,
  ) {}

  async execute(params: {
    senderId: string;
    conversationId: string;
    type: EMessageType;
    content?: string;
    mediaIds?: string[];
    replyToId?: string;
  }) {
    const { senderId, conversationId, type, content, mediaIds, replyToId } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.canUserSendMessage(senderId)) {
      throw new Response.ForbiddenError("Cannot send message here");
    }

    // Block check for DM conversations
    if (conversation.isDirect && this.blockRepo) {
      const otherUserId = conversation.getOtherMemberId(senderId);
      if (otherUserId) {
        const isBlocked = await this.blockRepo.isEitherBlocked(senderId, otherUserId);
        if (isBlocked) {
          throw new Response.ForbiddenError("Không thể gửi tin nhắn cho người dùng này");
        }
      }
    }

    const entity = MessageEntity.create({
      conversationId,
      senderId,
      type,
      content,
      mediaIds: mediaIds || [],
      replyToId,
    });

    const message = await this.messageRepo.create(entity);

    // Update conversation lastMessage
    await this.conversationRepo.updateLastMessage(conversationId, {
      messageId: message.id!,
      senderId: message.senderId,
      content: message.getContentPreview(),
      type: message.type,
      createdAt: message.createdAt,
    });

    // Resolve mediaIds to URLs
    let mediaUrls: string[] = [];
    if (message.mediaIds && message.mediaIds.length > 0 && this.mediaRepo && this.fileStorageService) {
      const mediaEntities = await this.mediaRepo.findByIds([...message.mediaIds]);
      mediaUrls = mediaEntities
        .filter((m) => m.id && m.key)
        .map((m) => this.fileStorageService!.getPublicUrl(m.key));
    }

    let replyTo = undefined;
    if (message.replyToId) {
      const repliedMsg = await this.messageRepo.findById(message.replyToId);
      if (repliedMsg) {
        let replyToSender = undefined;
        if (repliedMsg.senderId) {
          // You might need to inject userRepo to SendMessageUseCase if needed, but since it's an optimistic return, providing senderId and content is enough.
          // Wait, userRepo isn't injected here. We can just return the id and content.
          replyTo = {
            id: repliedMsg.id,
            content: repliedMsg.content,
            type: repliedMsg.type,
            senderId: repliedMsg.senderId,
            mediaIds: repliedMsg.mediaIds,
          };
        }
      }
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      mediaIds: message.mediaIds,
      mediaUrls,
      isUnsent: message.isUnsent,
      createdAt: message.createdAt?.toISOString(),
      isMine: true,
      reactions: message.reactions,
      replyToId: message.replyToId,
      replyTo,
      forwardedFromId: message.forwardedFromId,
      // For socket: emit to each member's room
      _memberIds: conversation.memberIds,
    };
  }
}

