import RedisService from "./redis.service";
import { ITypingService } from "@/application/services/typing.service";

// ============================================================================
// REDIS KEYS
// ============================================================================
const TYPING_PREFIX = "typing:";
const TYPING_TTL_SECONDS = 5; // Auto-expire typing indicator after 5 seconds

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class RedisTypingService implements ITypingService {
  private readonly redis: RedisService;

  constructor() {
    this.redis = RedisService.getInstance();
  }

  /**
   * Mark user as typing in a conversation.
   * Uses a per-user key with TTL for auto-expiry:
   *   typing:{conversationId}:{userId} = "1" EX 5
   *
   * Client should debounce emit to every 2 seconds.
   * Server key expires after 5 seconds (safety margin).
   */
  async setTyping(conversationId: string, userId: string): Promise<void> {
    const key = `${TYPING_PREFIX}${conversationId}:${userId}`;
    await this.redis.set(key, "1", TYPING_TTL_SECONDS);
  }

  /**
   * Clear typing indicator immediately (user stopped typing or sent message).
   */
  async clearTyping(conversationId: string, userId: string): Promise<void> {
    const key = `${TYPING_PREFIX}${conversationId}:${userId}`;
    await this.redis.del(key);
  }

  /**
   * Get all users currently typing in a conversation.
   * Scans keys matching typing:{conversationId}:* pattern.
   */
  async getTyping(conversationId: string): Promise<string[]> {
    const pattern = `${TYPING_PREFIX}${conversationId}:*`;
    const keys = await this.redis.scanKeys(pattern);

    // Extract userId from key format: typing:{conversationId}:{userId}
    const prefix = `${TYPING_PREFIX}${conversationId}:`;
    return keys
      .map((key) => {
        // Remove Redis keyPrefix if present
        const cleanKey = key.includes(prefix) ? key.substring(key.indexOf(prefix)) : key;
        return cleanKey.replace(prefix, "");
      })
      .filter((id) => id.length > 0);
  }
}
