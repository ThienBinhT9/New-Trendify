import { useEffect, useMemo } from "react";
import {
  usePresenceContext,
  type PresenceData,
} from "@/provider/presence-context.shared";

// ============================================================================
// usePresence — single user
// ============================================================================

/**
 * Get real-time presence status for a single user.
 *
 * Subscribes automatically on mount, unsubscribes on unmount.
 * Returns offline as default if data not yet available.
 *
 * @example
 * ```tsx
 * const { status, lastSeen } = usePresence(userId);
 * // status: "online" | "idle" | "offline"
 * ```
 */
export const usePresence = (userId: string | undefined): PresenceData => {
  const { getPresence, subscribe, version } = usePresenceContext();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribe([userId]);
    return unsubscribe;
  }, [userId, subscribe]);

  return useMemo(() => {
    if (!userId) return { status: "offline" as const };
    return getPresence(userId) ?? { status: "offline" as const };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, version, getPresence]);
};

// ============================================================================
// usePresenceBatch — multiple users
// ============================================================================

/**
 * Get real-time presence status for multiple users.
 *
 * Subscribes automatically on mount. Returns a Map of userId → PresenceData.
 * Ideal for conversation list, follower list, etc.
 *
 * @example
 * ```tsx
 * const presenceMap = usePresenceBatch(userIds);
 * const status = presenceMap.get(userId)?.status ?? "offline";
 * ```
 */
export const usePresenceBatch = (
  userIds: string[],
): Map<string, PresenceData> => {
  const { getPresence, subscribe, version } = usePresenceContext();

  // Stable stringify to avoid unnecessary re-subscriptions
  const idsKey = userIds.join(",");

  useEffect(() => {
    if (userIds.length === 0) return;

    const unsubscribe = subscribe(userIds);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, subscribe]);

  return useMemo(() => {
    const result = new Map<string, PresenceData>();

    userIds.forEach((id) => {
      const presence = getPresence(id);
      if (presence) {
        result.set(id, presence);
      }
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, version, getPresence]);
};
