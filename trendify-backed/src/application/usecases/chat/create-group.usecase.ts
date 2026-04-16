import { IConversationRepository } from "@/domain/chat";
import { IUserRepository } from "@/domain/user/user.abstract";
import { ConversationEntity } from "@/domain/chat";
import * as Response from "@/shared/responses";

export class CreateGroupUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(params: {
    creatorId: string;
    name: string;
    memberIds: string[];
    avatarMediaId?: string;
  }) {
    const { creatorId, name, memberIds, avatarMediaId } = params;

    if (!name || name.trim().length === 0) {
      throw new Response.BadRequestError("Group name is required");
    }

    if (name.trim().length > 100) {
      throw new Response.BadRequestError("Group name cannot exceed 100 characters");
    }

    if (!memberIds || memberIds.length < 1) {
      throw new Response.BadRequestError("Group must have at least 1 other member");
    }

    // Verify all members exist
    const uniqueMemberIds = [...new Set([...memberIds])];
    for (const memberId of uniqueMemberIds) {
      if (memberId === creatorId) continue;
      const user = await this.userRepo.findById(memberId);
      if (!user) {
        throw new Response.NotFoundError(`User ${memberId} not found`);
      }
    }

    const entity = ConversationEntity.createGroup({
      creatorId,
      name: name.trim(),
      memberIds: uniqueMemberIds,
      avatarMediaId,
    });

    const conversation = await this.conversationRepo.create(entity);

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      members: conversation.members,
      createdBy: conversation.createdBy,
      createdAt: conversation.data.createdAt?.toISOString(),
      updatedAt: conversation.data.updatedAt?.toISOString(),
    };
  }
}
