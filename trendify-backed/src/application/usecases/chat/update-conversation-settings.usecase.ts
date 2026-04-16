import { IConversationRepository, IConversationSettings } from "@/domain/chat";
import * as Response from "@/shared/responses";

export class UpdateConversationSettingsUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
  ) {}

  async execute(params: {
    userId: string;
    conversationId: string;
    settings: Partial<IConversationSettings>;
  }) {
    const { userId, conversationId, settings } = params;

    // Verify membership
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.isMember(userId)) {
      throw new Response.ForbiddenError("Not a member of this conversation");
    }

    // Validate settings
    if (settings.themeId !== undefined && typeof settings.themeId !== "string") {
      throw new Response.BadRequestError("Invalid themeId");
    }

    if (settings.quickEmoji !== undefined && typeof settings.quickEmoji !== "string") {
      throw new Response.BadRequestError("Invalid quickEmoji");
    }

    if (settings.nicknames) {
      for (const [targetUserId] of Object.entries(settings.nicknames)) {
        if (!conversation.isMember(targetUserId)) {
          throw new Response.BadRequestError(`User ${targetUserId} is not a member`);
        }
      }
    }

    await this.conversationRepo.updateSettings(conversationId, settings);

    return {
      conversationId,
      settings,
      updatedBy: userId,
    };
  }
}
