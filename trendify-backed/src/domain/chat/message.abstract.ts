import { MessageEntity } from "./message.entity";
import { IMessageReaction, IMessageReadReceipt, MessageReactionEmoji } from "./message.type";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface IMessageRepository {
  /**
   * Create a new message.
   */
  create(entity: MessageEntity): Promise<MessageEntity>;

  /**
   * Find message by ID.
   */
  findById(id: string): Promise<MessageEntity | null>;

  /**
   * Get messages in a conversation with cursor-based pagination.
   * Returns newest first. Excludes messages deleted for `userId`.
   * Cursor is a messageId — returns messages older than cursor.
   */
  findByConversation(
    conversationId: string,
    options: {
      limit: number;
      cursor?: string;
      userId: string;
    },
  ): Promise<{ messages: MessageEntity[]; nextCursor?: string }>;

  /**
   * Full-text search within a conversation.
   * Uses MongoDB text index on `content` field.
   */
  searchInConversation(
    conversationId: string,
    query: string,
    options: {
      limit: number;
      cursor?: string;
      userId: string;
    },
  ): Promise<{ messages: MessageEntity[]; nextCursor?: string }>;

  /**
   * Add a reaction to a message.
   * Replaces existing reaction from the same user (1 reaction per user).
   */
  addReaction(messageId: string, reaction: IMessageReaction): Promise<void>;

  /**
   * Remove a specific reaction from a message.
   */
  removeReaction(messageId: string, userId: string, emoji: MessageReactionEmoji): Promise<void>;

  /**
   * Mark a single message as read by a user.
   */
  markAsRead(messageId: string, readReceipt: IMessageReadReceipt): Promise<void>;

  /**
   * Mark all messages up to a certain message as read for a user.
   * Uses bulk update: all messages in conversation with _id <= upToMessageId.
   */
  markManyAsRead(
    conversationId: string,
    userId: string,
    upToMessageId: string,
  ): Promise<number>;

  /**
   * Unsend (recall) a message — clears content, keeps metadata.
   */
  unsendMessage(messageId: string): Promise<void>;

  /**
   * Soft-delete message for a specific user.
   */
  deleteForUser(messageId: string, userId: string): Promise<void>;

  /**
   * Batch mark messages as delivered to a user.
   */
  markAsDelivered(messageIds: string[], userId: string): Promise<void>;

  /**
   * Count unread messages in a conversation for a user.
   * Counts messages NOT in readBy and NOT sent by user, after lastReadMessageId.
   */
  countUnread(
    conversationId: string,
    userId: string,
    sinceMessageId?: string,
  ): Promise<number>;

  /**
   * Find messages by IDs (for pinned messages display).
   */
  findByIds(ids: string[]): Promise<MessageEntity[]>;

  /**
   * Hard-delete all messages in a conversation.
   */
  deleteByConversation(conversationId: string): Promise<void>;
}
