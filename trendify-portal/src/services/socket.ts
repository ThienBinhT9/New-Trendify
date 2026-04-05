import { io, type Socket } from "socket.io-client";

import store from "@/stores";
import { refreshTokenAction } from "@/stores/auth/actions";
import type { INotificationActor } from "@/stores/notification/constants";
import { getStorageTokens } from "@/utils/storage.util";

export type SocketConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export interface NotificationSocketPayload {
  id: string;
  type: "follow" | "follow_request" | "post_like" | "post_comment" | "post_mention";
  actor: INotificationActor;
  targetId: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Payload for aggregated notification updates (post_like).
 * Emitted when someone likes a post — FE upserts by notification ID.
 */
export interface AggregatedNotificationPayload {
  id: string;
  type: "post_like";
  actor: INotificationActor;
  totalActorCount: number;
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationUnreadCountPayload {
  unreadCount: number;
}

export interface NotificationReadPayload {
  notificationId: string;
}

interface ServerToClientEvents {
  "notification:new": (payload: NotificationSocketPayload) => void;
  "notification:updated": (payload: AggregatedNotificationPayload) => void;
  "notification:unread-count": (payload: NotificationUnreadCountPayload) => void;
  "notification:read": (payload: NotificationReadPayload) => void;
  "notification:read-all": (payload: NotificationUnreadCountPayload) => void;
}

type ClientToServerEvents = Record<string, never>;

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const normalizeSocketBaseUrl = (value?: string): string | undefined => {
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return value;
  }
};

const SOCKET_URL = normalizeSocketBaseUrl(
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL,
);

const SOCKET_OPTIONS = {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 12,
  reconnectionDelay: 800,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
};

const AUTH_RECOVERY_COOLDOWN_MS = 15000;
const MAX_AUTH_RECOVERY_ATTEMPTS = 1;

let socketInstance: AppSocket | null = null;
let refreshPromise: Promise<void> | null = null;
let authRecovering = false;
let authRecoveryAttempts = 0;
let lastAuthRecoveryAt = 0;

const getAccessToken = () => {
  const { accessToken } = getStorageTokens();
  return accessToken || "";
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = store
      .dispatch(refreshTokenAction())
      .unwrap()
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const shouldRecoverAuth = (error: Error) => {
  const message = `${error?.message || ""}`.toLowerCase();

  return (
    message.includes("authentication required") || message.includes("invalid or expired token")
  );
};

const bindAuthRecovery = (socket: AppSocket) => {
  const handleConnected = () => {
    authRecoveryAttempts = 0;
  };

  socket.off("connect", handleConnected);
  socket.on("connect", handleConnected);

  socket.off("connect_error");
  socket.on("connect_error", async (error: Error) => {
    if (!shouldRecoverAuth(error) || authRecovering) {
      return;
    }

    const now = Date.now();
    const inCooldown = now - lastAuthRecoveryAt < AUTH_RECOVERY_COOLDOWN_MS;
    if (authRecoveryAttempts >= MAX_AUTH_RECOVERY_ATTEMPTS || inCooldown) {
      socket.disconnect();
      return;
    }

    authRecovering = true;
    authRecoveryAttempts += 1;
    lastAuthRecoveryAt = now;

    try {
      await refreshAccessToken();
      const token = getAccessToken();

      if (!token) {
        socket.disconnect();
        return;
      }

      socket.auth = { token };

      // Avoid forcing repeated manual reconnect while manager is already reconnecting.
      if (!socket.connected && !socket.active) {
        socket.connect();
      }
    } catch {
      socket.disconnect();
    } finally {
      authRecovering = false;
    }
  });
};

export const getSocket = (): AppSocket => {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(SOCKET_URL, {
    ...SOCKET_OPTIONS,
    auth: (callback: (data: { token: string }) => void) => {
      callback({ token: getAccessToken() });
    },
  });

  bindAuthRecovery(socketInstance);

  return socketInstance;
};

export const connectSocket = () => {
  const socket = getSocket();
  const token = getAccessToken();

  if (!token) {
    return socket;
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = (removeAllListeners = false) => {
  if (!socketInstance) {
    return;
  }

  if (removeAllListeners) {
    socketInstance.removeAllListeners();
    socketInstance.io.removeAllListeners();
  }

  socketInstance.disconnect();
};

export const destroySocket = () => {
  if (!socketInstance) {
    return;
  }

  socketInstance.removeAllListeners();
  socketInstance.io.removeAllListeners();
  socketInstance.disconnect();
  socketInstance = null;
};
