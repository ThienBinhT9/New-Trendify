import { IConversationRepository } from "@/domain/chat";
import { IUserRepository } from "@/domain/user/user.abstract";
import { EConversationRole } from "@/domain/chat/conversation.type";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import * as Response from "@/shared/responses";

export class ManageGroupUseCase {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  /**
   * Add a member to a group conversation.
   * Only admins/owners can add members.
   */
  async addMember(params: { actorId: string; conversationId: string; userId: string }) {
    const { actorId, conversationId, userId } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.isGroup) throw new Response.BadRequestError("Not a group conversation");
    if (!conversation.canManageMembers(actorId)) {
      throw new Response.ForbiddenError("Only admins can add members");
    }

    if (conversation.isMember(userId)) {
      throw new Response.BadRequestError("User is already a member");
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new Response.NotFoundError("User not found");

    conversation.addMember(userId);
    await this.conversationRepo.addMember(conversationId, {
      userId,
      role: EConversationRole.MEMBER,
      joinedAt: new Date(),
      isArchived: false,
      isPinned: false,
    });

    return { success: true, memberId: userId };
  }

  /**
   * Remove a member from a group conversation.
   * Admins can kick members. Members can only remove themselves (leave).
   */
  async removeMember(params: { actorId: string; conversationId: string; userId: string }) {
    const { actorId, conversationId, userId } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.isGroup) throw new Response.BadRequestError("Not a group conversation");

    // If removing self → allow (leave group)
    // If removing others → must be admin
    if (actorId !== userId && !conversation.canManageMembers(actorId)) {
      throw new Response.ForbiddenError("Only admins can remove members");
    }

    if (!conversation.isMember(userId)) {
      throw new Response.BadRequestError("User is not a member");
    }

    if (conversation.isOwner(userId)) {
      if (actorId !== userId) {
        throw new Response.ForbiddenError("Bạn không thể đuổi Trưởng nhóm.");
      }
      // If owner is leaving, find the next oldest member to transfer ownership
      const otherMembers = conversation.members.filter((m) => m.userId !== userId);
      if (otherMembers.length > 0) {
        const nextOwner = otherMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
        await this.conversationRepo.updateMemberRole(conversationId, nextOwner.userId, EConversationRole.OWNER);
      }
    }

    await this.conversationRepo.removeMember(conversationId, userId);

    return { success: true, removedUserId: userId };
  }

  /**
   * Leave the group.
   */
  async leaveGroup(params: { actorId: string; conversationId: string }) {
    return this.removeMember({
      actorId: params.actorId,
      conversationId: params.conversationId,
      userId: params.actorId,
    });
  }

  /**
   * Update group info (name, avatar).
   * Only admins/owner can update.
   */
  async updateGroupInfo(params: {
    actorId: string;
    conversationId: string;
    name?: string;
    avatarMediaId?: string;
  }) {
    const { actorId, conversationId, name, avatarMediaId } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");
    if (!conversation.isGroup) throw new Response.BadRequestError("Not a group conversation");
    if (!conversation.canManageMembers(actorId)) {
      throw new Response.ForbiddenError("Only admins can update group info");
    }

    if (name !== undefined && name.trim().length > 100) {
      throw new Response.BadRequestError("Group name cannot exceed 100 characters");
    }

    const updates: { name?: string; avatarMediaId?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (avatarMediaId !== undefined) updates.avatarMediaId = avatarMediaId;

    await this.conversationRepo.updateGroupInfo(conversationId, updates);

    return { success: true, ...updates };
  }

  /**
   * Get members of a group along with basic user details.
   */
  async getMembers(params: { conversationId: string }) {
    const { conversationId } = params;

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Response.NotFoundError("Conversation not found");

    const memberIds = conversation.members.map((m) => m.userId);
    const users = await this.userRepo.findByIds(memberIds);

    // Fetch media for avatars
    const mediaIds = users.filter((u) => u.data.profilePicture).map((u) => u.data.profilePicture as string);
    const mediaEntities = await this.mediaRepo.findByIds(mediaIds);
    const mediaRecord = mediaEntities.reduce((acc: any, media: any) => {
      acc[media.id] = media;
      return acc;
    }, {});

    const { MediaMapper } = await import("@/application/mappers/media.mapper");

    return conversation.members.map((m) => {
      const user = users.find((u) => u.id === m.userId);
      return {
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: user
          ? {
              id: user.id,
              username: user.data.username,
              displayName: `${user.data.firstName} ${user.data.lastName}`,
              profilePicture: MediaMapper.resolveVariantMap(
                user.data.profilePicture,
                mediaRecord,
                this.fileStorageService,
              ),
            }
          : null,
      };
    });
  }
}
