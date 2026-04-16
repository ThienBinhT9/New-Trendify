// ============================================================================
// TYPING SERVICE INTERFACE
// ============================================================================

export interface ITypingService {
  /**
   * Mark user as typing in a conversation.
   * Auto-expires after TTL (typically 5 seconds).
   */
  setTyping(conversationId: string, userId: string): Promise<void>;

  /**
   * Clear typing indicator for a user.
   */
  clearTyping(conversationId: string, userId: string): Promise<void>;

  /**
   * Get all users currently typing in a conversation.
   */
  getTyping(conversationId: string): Promise<string[]>;
}
