import { IMessageRepository, IConversationRepository } from "@/domain/chat";
import { MessageReactionEmoji } from "@/domain/chat/message.type";
import * as Response from "@/shared/responses";

export class ToggleReactionUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly conversationRepo: IConversationRepository,
  ) {}

  async execute(params: {
    userId: string;
    conversationId: string;
    messageId: string;
    emoji: MessageReactionEmoji;
  }) {
    const { userId, conversationId, messageId, emoji } = params;

    // Verify conversation membership
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.isMember(userId)) {
      throw new Response.ForbiddenError("Not a member of this conversation");
    }

    // Get message
    const message = await this.messageRepo.findById(messageId);
    if (!message) throw new Response.NotFoundError("Message not found");
    if (message.conversationId !== conversationId) {
      throw new Response.BadRequestError("Message does not belong to this conversation");
    }

    // Toggle: if already reacted with same emoji → remove, else → add
    const hasReaction = message.hasReactionFrom(userId, emoji);

    if (hasReaction) {
      await this.messageRepo.removeReaction(messageId, userId, emoji);
      return { action: "removed" as const, messageId, emoji, userId };
    } else {
      await this.messageRepo.addReaction(messageId, {
        userId,
        emoji,
        createdAt: new Date(),
      });
      return { action: "added" as const, messageId, emoji, userId };
    }
  }
}
