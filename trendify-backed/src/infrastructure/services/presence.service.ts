import RedisService from "./redis.service";
import {
  IPresenceService,
  PresenceStatus,
  EPresenceStatus,
} from "@/application/services/presence.service";

// ============================================================================
// REDIS KEY PATTERNS
// ============================================================================
// presence:{userId}          → Hash { status, lastSeen, idleSince? }
// presence:sockets:{userId}  → Set  { socketId1, socketId2, ... }
// ============================================================================

const PRESENCE_PREFIX = "presence:";
const SOCKET_SET_PREFIX = "presence:sockets:";

/**
 * TTL khi user đang online.
 * Nếu heartbeat dừng (client crash, mất mạng) → key tự expire sau 5 phút.
 * Client gửi heartbeat mỗi 60s → luôn renew trước khi hết hạn.
 */
const ONLINE_TTL_SECONDS = 300; // 5 minutes

/**
 * TTL khi user offline.
 * Giữ lastSeen data cho "Active X hours ago" feature trong 24h.
 */
const OFFLINE_TTL_SECONDS = 86400; // 24 hours

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class RedisPresenceService implements IPresenceService {
  private readonly redis: RedisService;

  constructor() {
    this.redis = RedisService.getInstance();
  }

  /**
   * Mark user as online when a socket connects.
   * Maintains a Set of active socket IDs per user for multi-tab support.
   *
   * Redis ops: SADD + HSET×2 + EXPIRE×2 = 5 ops
   */
  async setOnline(userId: string, socketId: string): Promise<void> {
    const socketKey = `${SOCKET_SET_PREFIX}${userId}`;
    const presenceKey = `${PRESENCE_PREFIX}${userId}`;

    // Add socket ID to the user's active sockets set
    await this.redis.sadd(socketKey, socketId);

    // Set presence data
    await this.redis.hSet(presenceKey, "status", EPresenceStatus.ONLINE);
    await this.redis.hSet(presenceKey, "lastSeen", Date.now().toString());

    // Remove stale idleSince if coming back from idle
    await this.redis.hdel(presenceKey, "idleSince");

    // Set TTL — auto-expire if heartbeat stops
    await this.redis.expire(presenceKey, ONLINE_TTL_SECONDS);
    await this.redis.expire(socketKey, ONLINE_TTL_SECONDS);
  }

  /**
   * Mark user as offline when a socket disconnects.
   * Only sets offline when ALL sockets are disconnected (multi-tab safe).
   *
   * Returns true if user became fully offline (no remaining sockets).
   *
   * Redis ops: SREM + SCARD + (HSET×2 + EXPIRE + DEL | noop) = 3–6 ops
   */
  async setOffline(userId: string, socketId: string): Promise<boolean> {
    const socketKey = `${SOCKET_SET_PREFIX}${userId}`;
    const presenceKey = `${PRESENCE_PREFIX}${userId}`;

    // Remove this specific socket from the set
    await this.redis.srem(socketKey, socketId);

    // Check if any sockets remain
    const remaining = await this.redis.scard(socketKey);

    if (remaining === 0) {
      // Fully offline — no tabs left
      await this.redis.hSet(presenceKey, "status", EPresenceStatus.OFFLINE);
      await this.redis.hSet(presenceKey, "lastSeen", Date.now().toString());
      await this.redis.hdel(presenceKey, "idleSince");

      // Keep presence data for "last active X minutes ago" feature
      await this.redis.expire(presenceKey, OFFLINE_TTL_SECONDS);
      await this.redis.del(socketKey);

      return true; // fully offline
    }

    return false; // still has other tabs open
  }

  /**
   * Mark user as idle (tab hidden or no user interaction for X minutes).
   *
   * Redis ops: HSET×2 = 2 ops
   */
  async setIdle(userId: string): Promise<void> {
    const presenceKey = `${PRESENCE_PREFIX}${userId}`;

    // Only set idle if currently online (avoid overwriting offline)
    const currentStatus = await this.redis.hGet(presenceKey, "status");
    if (currentStatus !== EPresenceStatus.ONLINE) return;

    await this.redis.hSet(presenceKey, "status", EPresenceStatus.IDLE);
    await this.redis.hSet(presenceKey, "idleSince", Date.now().toString());

    // Keep the TTL — heartbeat still renews while idle
  }

  /**
   * Mark user as active again (came back from idle state).
   *
   * Redis ops: HSET×2 + HDEL = 3 ops
   */
  async setActive(userId: string): Promise<void> {
    const presenceKey = `${PRESENCE_PREFIX}${userId}`;

    await this.redis.hSet(presenceKey, "status", EPresenceStatus.ONLINE);
    await this.redis.hSet(presenceKey, "lastSeen", Date.now().toString());
    await this.redis.hdel(presenceKey, "idleSince");
  }

  /**
   * Refresh heartbeat — renew TTL to keep presence alive.
   * Client should call every 60s. Key expires after 300s (5 min safety margin).
   *
   * Redis ops: HSET + EXPIRE×2 = 3 ops
   */
  async refreshHeartbeat(userId: string, socketId: string): Promise<void> {
    const socketKey = `${SOCKET_SET_PREFIX}${userId}`;
    const presenceKey = `${PRESENCE_PREFIX}${userId}`;

    // Update last seen timestamp
    await this.redis.hSet(presenceKey, "lastSeen", Date.now().toString());

    // Renew TTL for both keys
    await this.redis.expire(presenceKey, ONLINE_TTL_SECONDS);
    await this.redis.expire(socketKey, ONLINE_TTL_SECONDS);
  }

  /**
   * Get presence status for a single user.
   *
   * Redis ops: 1 HGETALL
   */
  async getStatus(userId: string): Promise<PresenceStatus> {
    const presenceKey = `${PRESENCE_PREFIX}${userId}`;
    const data = await this.redis.hGetAll(presenceKey);

    if (!data || Object.keys(data).length === 0) {
      return { status: EPresenceStatus.OFFLINE };
    }

    return {
      status: (data.status as EPresenceStatus) || EPresenceStatus.OFFLINE,
      lastSeen: data.lastSeen
        ? new Date(parseInt(data.lastSeen, 10))
        : undefined,
      idleSince: data.idleSince
        ? new Date(parseInt(data.idleSince, 10))
        : undefined,
    };
  }

  /**
   * Batch presence lookup for multiple users.
   * Uses Promise.all for concurrent Redis calls.
   *
   * Redis ops: N × HGETALL
   */
  async getStatusBatch(
    userIds: string[],
  ): Promise<Map<string, PresenceStatus>> {
    const result = new Map<string, PresenceStatus>();

    if (userIds.length === 0) return result;

    const statuses = await Promise.all(
      userIds.map((id) => this.getStatus(id)),
    );

    userIds.forEach((id, index) => {
      result.set(id, statuses[index]);
    });

    return result;
  }

  /**
   * Filter a list of user IDs to only online ones.
   */
  async getOnlineUserIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const statuses = await this.getStatusBatch(userIds);
    return userIds.filter((id) => {
      const s = statuses.get(id);
      return s?.status === EPresenceStatus.ONLINE || s?.status === EPresenceStatus.IDLE;
    });
  }
}
