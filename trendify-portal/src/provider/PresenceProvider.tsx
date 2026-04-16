import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { throttle } from "lodash";

import { getSocket } from "@/services/socket";
import type { PresenceChangedPayload } from "@/services/socket";
import { useSocketContext } from "./socket-context.shared";
import {
  PresenceContext,
  type PresenceContextValue,
  type PresenceData,
  type PresenceStatusType,
} from "./presence-context.shared";
import client from "@/services/api-clients";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Heartbeat interval — ping server every 60s to renew TTL */
const HEARTBEAT_INTERVAL_MS = 60_000;

/** Idle threshold — mark as idle after 5 minutes of no user interaction */
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;

/** Throttle user activity detection to avoid excessive event processing */
const ACTIVITY_THROTTLE_MS = 30_000;

// ============================================================================
// PROVIDER
// ============================================================================

const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useSocketContext();

  // ── In-memory presence cache ──
  const presenceMapRef = useRef<Map<string, PresenceData>>(new Map());
  const [version, setVersion] = useState(0);

  // ── Idle state tracking ──
  const isIdleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Subscription tracking ──
  const subscribedIdsRef = useRef<Set<string>>(new Set());

  // ── Bump version to trigger re-renders in consumers ──
  const bumpVersion = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  // ============================================================================
  // HEARTBEAT — mỗi 60s gửi ping để server renew TTL
  // ============================================================================
  useEffect(() => {
    if (!isConnected) {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    const socket = getSocket();

    heartbeatTimerRef.current = setInterval(() => {
      socket.emit("presence:heartbeat");
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [isConnected]);

  // ============================================================================
  // IDLE DETECTION — tab ẩn hoặc không tương tác 5 phút
  // ============================================================================
  useEffect(() => {
    if (!isConnected) return;

    const socket = getSocket();

    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const startIdleTimer = () => {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          socket.emit("presence:idle");
        }
      }, IDLE_THRESHOLD_MS);
    };

    // Throttled activity handler
    const handleActivity = throttle(() => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        socket.emit("presence:active");
      }
      startIdleTimer();
    }, ACTIVITY_THROTTLE_MS);

    // Tab visibility handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab ẩn → chuyển idle ngay
        clearIdleTimer();
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          socket.emit("presence:idle");
        }
      } else {
        // Tab active lại → chuyển active + gửi heartbeat
        if (isIdleRef.current) {
          isIdleRef.current = false;
          socket.emit("presence:active");
        }
        socket.emit("presence:heartbeat");
        startIdleTimer();
      }
    };

    // Bind listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    // Start idle timer
    startIdleTimer();

    return () => {
      clearIdleTimer();
      handleActivity.cancel();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [isConnected]);

  // ============================================================================
  // LISTEN PRESENCE CHANGES from socket
  // ============================================================================
  useEffect(() => {
    if (!isConnected) return;

    const socket = getSocket();

    const handlePresenceChanged = (payload: PresenceChangedPayload) => {
      presenceMapRef.current.set(payload.userId, {
        status: payload.status as PresenceStatusType,
        lastSeen: new Date(payload.lastSeen),
      });
      bumpVersion();
    };

    socket.on("presence:changed", handlePresenceChanged);

    return () => {
      socket.off("presence:changed", handlePresenceChanged);
    };
  }, [isConnected, bumpVersion]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const getPresence = useCallback(
    (userId: string): PresenceData | undefined => {
      return presenceMapRef.current.get(userId);
    },
    [],
  );

  const subscribe = useCallback(
    (userIds: string[]): (() => void) => {
      // Find IDs not yet fetched
      const newIds = userIds.filter(
        (id) =>
          !presenceMapRef.current.has(id) && !subscribedIdsRef.current.has(id),
      );

      if (newIds.length > 0) {
        // Mark as subscribed to avoid duplicate fetches
        newIds.forEach((id) => subscribedIdsRef.current.add(id));

        // Fetch via REST API
        client
          .post("/users/presence/batch", { userIds: newIds })
          .then((res) => {
            const data = res.data?.data;
            if (data && typeof data === "object") {
              Object.entries(data).forEach(
                ([userId, presence]: [string, any]) => {
                  presenceMapRef.current.set(userId, {
                    status: presence.status || "offline",
                    lastSeen: presence.lastSeen
                      ? new Date(presence.lastSeen)
                      : undefined,
                  });
                },
              );
              bumpVersion();
            }
          })
          .catch((error) => {
            console.error("Failed to fetch batch presence:", error);
            // Remove from subscribed so it can be retried
            newIds.forEach((id) => subscribedIdsRef.current.delete(id));
          });
      }

      // Return unsubscribe function
      return () => {
        userIds.forEach((id) => subscribedIdsRef.current.delete(id));
      };
    },
    [bumpVersion],
  );

  const value = useMemo<PresenceContextValue>(
    () => ({
      getPresence,
      subscribe,
      version,
    }),
    [getPresence, subscribe, version],
  );

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
};

export { PresenceProvider };
