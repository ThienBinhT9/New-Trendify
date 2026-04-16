import { ConversationEntity } from "./conversation.entity";
import { EConversationRole, IConversationMember, IConversationSettings, ILastMessageSnapshot } from "./conversation.type";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface IConversationRepository {
  /**
   * Create a new conversation.
   */
  create(entity: ConversationEntity): Promise<ConversationEntity>;

  /**
   * Find conversation by ID.
   */
  findById(id: string): Promise<ConversationEntity | null>;

  /**
   * Find an existing direct conversation between two users.
   * Returns null if no direct conversation exists.
   */
  findDirectConversation(userIdA: string, userIdB: string): Promise<ConversationEntity | null>;

  /**
   * Get user's conversation inbox with cursor-based pagination.
   * Sorted by lastMessage.createdAt DESC (newest activity first).
   */
  findByMember(
    userId: string,
    options: {
      limit: number;
      cursor?: string;
      isArchived?: boolean;
      isPinned?: boolean;
    },
  ): Promise<{ conversations: ConversationEntity[]; nextCursor?: string }>;

  /**
   * Atomically update the last message snapshot.
   */
  updateLastMessage(conversationId: string, lastMessage: ILastMessageSnapshot): Promise<void>;

  /**
   * Add a member to a group conversation.
   */
  addMember(conversationId: string, member: IConversationMember): Promise<void>;

  /**
   * Remove a member from a conversation.
   */
  removeMember(conversationId: string, userId: string): Promise<void>;

  /**
   * Update a member's role (admin/member).
   */
  updateMemberRole(
    conversationId: string,
    userId: string,
    role: EConversationRole,
  ): Promise<void>;

  /**
   * Update per-user conversation settings (mute, archive, pin, lastRead).
   */
  updateMemberSettings(
    conversationId: string,
    userId: string,
    settings: Partial<Pick<IConversationMember, "mutedUntil" | "isArchived" | "isPinned" | "lastReadMessageId" | "lastReadAt">>,
  ): Promise<void>;

  /**
   * Add a message to the pinned list.
   */
  pinMessage(conversationId: string, messageId: string): Promise<void>;

  /**
   * Remove a message from the pinned list.
   */
  unpinMessage(conversationId: string, messageId: string): Promise<void>;

  /**
   * Update group name and/or avatar.
   */
  updateGroupInfo(
    conversationId: string,
    updates: { name?: string; avatarMediaId?: string },
  ): Promise<void>;

  /**
   * Update conversation settings (theme, quickEmoji, nicknames).
   */
  updateSettings(
    conversationId: string,
    settings: Partial<IConversationSettings>,
  ): Promise<void>;

  /**
   * Count conversations with unread messages for a user.
   */
  countUnreadConversations(userId: string): Promise<number>;

  /**
   * Get all conversation IDs for a user (for socket room joining).
   */
  findConversationIdsByMember(userId: string): Promise<string[]>;

  /**
   * Hard-delete a conversation by ID.
   */
  deleteById(conversationId: string): Promise<void>;
}
