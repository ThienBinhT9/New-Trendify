// ============================================================================
// PRESENCE SERVICE INTERFACE
// ============================================================================

export enum EPresenceStatus {
  ONLINE = "online",
  IDLE = "idle",
  OFFLINE = "offline",
}

export interface PresenceStatus {
  status: EPresenceStatus;
  lastSeen?: Date;
  idleSince?: Date;
}

export interface IPresenceService {
  /**
   * Mark user as online (called on socket connect).
   * Tracks multiple socket IDs per user (multi-tab support).
   */
  setOnline(userId: string, socketId: string): Promise<void>;

  /**
   * Mark user as offline (called on socket disconnect).
   * Only fully offline when all sockets are disconnected.
   * Returns true if user is now fully offline (no remaining sockets).
   */
  setOffline(userId: string, socketId: string): Promise<boolean>;

  /**
   * Mark user as idle (tab hidden or no activity for X minutes).
   */
  setIdle(userId: string): Promise<void>;

  /**
   * Mark user as active again (came back from idle).
   */
  setActive(userId: string): Promise<void>;

  /**
   * Refresh heartbeat — renew TTL to keep presence alive.
   * Called periodically (every 60s) by the client.
   */
  refreshHeartbeat(userId: string, socketId: string): Promise<void>;

  /**
   * Get online status and last seen time for a user.
   */
  getStatus(userId: string): Promise<PresenceStatus>;

  /**
   * Batch get presence status for multiple users.
   * Used when loading conversation list to show online indicators.
   */
  getStatusBatch(userIds: string[]): Promise<Map<string, PresenceStatus>>;

  /**
   * Get all online user IDs from a list.
   * Efficient filtering for notification delivery decisions.
   */
  getOnlineUserIds(userIds: string[]): Promise<string[]>;
}
