import { IMessageRepository, IConversationRepository } from "@/domain/chat";
import * as Response from "@/shared/responses";

export class DeleteConversationUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly messageRepo: IMessageRepository,
  ) {}

  async execute(params: { userId: string; conversationId: string }) {
    const { userId, conversationId } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new Response.NotFoundError("Conversation not found");
    }

    if (!conversation.isMember(userId)) {
      throw new Response.ForbiddenError("You are not a member of this conversation");
    }

    // Hard delete all messages in this conversation
    await this.messageRepo.deleteByConversation(conversationId);

    // Hard delete the conversation itself
    await this.conversationRepo.deleteById(conversationId);

    return { conversationId };
  }
}
