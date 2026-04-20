import { Request, Response } from "express";
import { GetConversationsUseCase } from "@/application/usecases/chat/get-conversations.usecase";
import { CreateDMUseCase } from "@/application/usecases/chat/create-dm.usecase";
import { CreateGroupUseCase } from "@/application/usecases/chat/create-group.usecase";
import { ManageGroupUseCase } from "@/application/usecases/chat/manage-group.usecase";
import { GetMessagesUseCase } from "@/application/usecases/chat/get-messages.usecase";
import { SendMessageUseCase } from "@/application/usecases/chat/send-message.usecase";
import { DeleteConversationUseCase } from "@/application/usecases/chat/delete-conversation.usecase";
import { ToggleReactionUseCase } from "@/application/usecases/chat/toggle-reaction.usecase";
import { UpdateConversationSettingsUseCase } from "@/application/usecases/chat/update-conversation-settings.usecase";
import { PinConversationUseCase } from "@/application/usecases/chat/pin-conversation.usecase";
import { GetConversationMediaUseCase } from "@/application/usecases/chat/get-conversation-media.usecase";
import { SuccessResponse } from "@/shared/responses";
import { getIO } from "@/config/socket.config";

class ChatController {
  constructor(
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly createDMUseCase: CreateDMUseCase,
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly manageGroupUseCase: ManageGroupUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly deleteConversationUseCase: DeleteConversationUseCase,
    private readonly toggleReactionUseCase: ToggleReactionUseCase,
    private readonly updateConversationSettingsUseCase: UpdateConversationSettingsUseCase,
    private readonly pinConversationUseCase: PinConversationUseCase,
    private readonly getConversationMediaUseCase: GetConversationMediaUseCase,
  ) {}

  // ========== CONVERSATIONS ==========

  getConversations = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { limit = "20", cursor, filter } = request.query;

    const result = await this.getConversationsUseCase.execute({
      userId,
      limit: parseInt(limit as string, 10) || 20,
      cursor: cursor as string,
      filter: filter as string,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  createDM = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { participantId } = request.body;

    const result = await this.createDMUseCase.execute({
      creatorId: userId,
      participantId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(201).json(successResponse);
  };

  // ========== GROUP ==========

  createGroup = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { name, memberIds, avatarMediaId } = request.body;

    const result = await this.createGroupUseCase.execute({
      creatorId: userId,
      name,
      memberIds,
      avatarMediaId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(201).json(successResponse);
  };

  addMember = async (request: Request, response: Response) => {
    const actorId = response.locals?.auth?.userId;
    const { conversationId } = request.params;
    const { userId } = request.body;

    const result = await this.manageGroupUseCase.addMember({
      actorId,
      conversationId,
      userId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  removeMember = async (request: Request, response: Response) => {
    const actorId = response.locals?.auth?.userId;
    const { conversationId, userId } = request.params;

    const result = await this.manageGroupUseCase.removeMember({
      actorId,
      conversationId,
      userId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  leaveGroup = async (request: Request, response: Response) => {
    const actorId = response.locals?.auth?.userId;
    const { conversationId } = request.params;

    const result = await this.manageGroupUseCase.leaveGroup({
      actorId,
      conversationId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  updateGroup = async (request: Request, response: Response) => {
    const actorId = response.locals?.auth?.userId;
    const { conversationId } = request.params;
    const { name, avatarMediaId } = request.body;

    const result = await this.manageGroupUseCase.updateGroupInfo({
      actorId,
      conversationId,
      name,
      avatarMediaId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  getMembers = async (request: Request, response: Response) => {
    const { conversationId } = request.params;

    const result = await this.manageGroupUseCase.getMembers({ conversationId });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  // ========== MESSAGES ==========

  getMessages = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId } = request.params;
    const { limit = "30", cursor } = request.query;

    const result = await this.getMessagesUseCase.execute({
      userId,
      conversationId,
      limit: parseInt(limit as string, 10) || 30,
      cursor: cursor as string,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  sendMessage = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId } = request.params;

    const { type = "text", content, mediaIds, replyToId } = request.body;

    const result = await this.sendMessageUseCase.execute({
      senderId: userId,
      conversationId,
      type,
      content,
      mediaIds,
      replyToId,
    });

    // Extract memberIds for socket, then strip from API response
    const memberIds: string[] = (result as any)._memberIds || [];
    const { _memberIds, ...messageData } = result as any;

    // Emit real-time event to each member's personal room
    // This ensures even users who haven't joined the conversation room receive the event
    try {
      const io = getIO();
      for (const memberId of memberIds) {
        // Skip the sender — they handle their own messages via optimistic UI
        if (memberId === userId) continue;
        io.to(`user:${memberId}`).emit("chat:message", {
          conversationId,
          message: { ...messageData, isMine: false },
        });
      }
    } catch {
      // Socket emit is non-critical, don't fail the request
    }

    const successResponse = new SuccessResponse({ data: messageData });
    return response.status(201).json(successResponse);
  };

  // ========== REACTIONS ==========

  toggleReaction = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId, messageId } = request.params;
    const { emoji } = request.body;

    const result = await this.toggleReactionUseCase.execute({
      userId,
      conversationId,
      messageId,
      emoji,
    });

    const { memberIds, ...reactionData } = result;

    try {
      const io = getIO();
      for (const memberId of memberIds || []) {
        if (memberId === userId) continue;
        io.to(`user:${memberId}`).emit("chat:reaction", {
          conversationId,
          reaction: reactionData,
        });
      }
    } catch {
      // Ignored
    }

    const successResponse = new SuccessResponse({ data: reactionData });
    return response.status(200).json(successResponse);
  };

  // ========== SETTINGS ==========

  updateSettings = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId } = request.params;
    const { themeId, quickEmoji, nicknames } = request.body;

    const result = await this.updateConversationSettingsUseCase.execute({
      userId,
      conversationId,
      settings: { themeId, quickEmoji, nicknames },
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  pinConversation = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId } = request.params;

    const result = await this.pinConversationUseCase.execute({
      userId,
      conversationId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  getConversationMedia = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId } = request.params;
    const { type, limit = "30", cursor } = request.query;

    const result = await this.getConversationMediaUseCase.execute({
      userId,
      conversationId,
      type: (type as any) ?? "all",
      limit: parseInt(limit as string, 10) || 30,
      cursor: cursor as string | undefined,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };

  // ========== DELETE ==========

  deleteConversation = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { conversationId } = request.params;

    const result = await this.deleteConversationUseCase.execute({
      userId,
      conversationId,
    });

    const successResponse = new SuccessResponse({ data: result });
    return response.status(200).json(successResponse);
  };
}

export default ChatController;
