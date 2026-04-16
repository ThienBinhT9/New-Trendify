import { IConversationRepository } from "@/domain/chat";
import { IUserRepository } from "@/domain/user/user.abstract";
import { ConversationEntity } from "@/domain/chat";
import * as Response from "@/shared/responses";

export class CreateDMUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(params: { creatorId: string; participantId: string }) {
    const { creatorId, participantId } = params;

    if (creatorId === participantId) {
      throw new Response.BadRequestError("Cannot create DM with yourself");
    }

    const participant = await this.userRepo.findById(participantId);
    if (!participant) {
      throw new Response.NotFoundError("Participant not found");
    }

    // Check if DM already exists
    let conversation = await this.conversationRepo.findDirectConversation(creatorId, participantId);
    if (!conversation) {
      const entity = ConversationEntity.createDirect({ creatorId, participantId });
      conversation = await this.conversationRepo.create(entity);
    }

    return {
      id: conversation.id,
      type: conversation.type,
      members: conversation.members,
      createdAt: conversation.data.createdAt?.toISOString(),
      updatedAt: conversation.data.updatedAt?.toISOString(),
    };
  }
}
