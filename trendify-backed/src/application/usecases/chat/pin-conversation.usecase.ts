import { ConversationModel } from "@/infrastructure/database/models/conversation.model";
import * as Response from "@/shared/responses";

export class PinConversationUseCase {
  async execute(params: { userId: string; conversationId: string }) {
    const { userId, conversationId } = params;

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || conversation.isDeleted) {
      throw new Response.NotFoundError("Conversation not found");
    }

    const memberIndex = conversation.members.findIndex(
      (m: any) => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      throw new Response.ForbiddenError("You are not a member of this conversation");
    }

    const currentStatus = conversation.members[memberIndex].isPinned;
    conversation.members[memberIndex].isPinned = !currentStatus;

    await conversation.save();

    return { 
      conversationId: conversation.id, 
      isPinned: !currentStatus 
    };
  }
}
