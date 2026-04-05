import { App } from "antd";
import { useCallback, useEffect, useMemo, type SetStateAction, useState } from "react";

import {
  getSocket,
  type AggregatedNotificationPayload,
  type NotificationReadPayload,
  type NotificationSocketPayload,
  type NotificationUnreadCountPayload,
} from "@/services/socket";
import { useSocket } from "@/hooks/useSocket";
import { useAppDispatch, useAppSelector } from "@/stores";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/stores/notification/actions";
import {
  incrementUnreadCount,
  markNotificationAsReadLocal,
  setUnreadCount as setUnreadCountAction,
  upsertNotificationItem,
} from "@/stores/notification/slice";

const LAST_SEEN_STORAGE_KEY = "notification:last_seen_at";
const AUTO_SYNC_COOLDOWN_MS = 12000;

let unreadCountCache = 0;
const unreadSubscribers = new Set<(value: number) => void>();
const sharedSeenEventAt = new Map<string, number>();
const sharedReadIds = new Set<string>();
let autoSyncInFlight: Promise<void> | null = null;
let lastAutoSyncAt = 0;

const MAX_SEEN_EVENT_KEYS = 500;
const EVENT_DEDUP_WINDOW_MS = 2500;

const shouldSkipDuplicateEvent = (eventKey: string): boolean => {
  const now = Date.now();
  const seenAt = sharedSeenEventAt.get(eventKey);
  sharedSeenEventAt.set(eventKey, now);

  if (typeof seenAt === "number" && now - seenAt < EVENT_DEDUP_WINDOW_MS) {
    return true;
  }

  if (sharedSeenEventAt.size > MAX_SEEN_EVENT_KEYS) {
    for (const [key, timestamp] of sharedSeenEventAt) {
      if (now - timestamp > EVENT_DEDUP_WINDOW_MS) {
        sharedSeenEventAt.delete(key);
      }

      if (sharedSeenEventAt.size <= MAX_SEEN_EVENT_KEYS) {
        break;
      }
    }
  }

  return false;
};

const publishUnreadCount = (nextValue: number) => {
  unreadCountCache = Math.max(0, nextValue);
  unreadSubscribers.forEach((subscriber) => subscriber(unreadCountCache));
};

const subscribeUnreadCount = (subscriber: (value: number) => void) => {
  unreadSubscribers.add(subscriber);

  return () => {
    unreadSubscribers.delete(subscriber);
  };
};

interface UseNotificationsOptions {
  enabled?: boolean;
  listenSocket?: boolean;
  autoSyncOnConnected?: boolean;
  syncMissedOnConnected?: boolean;
  syncUnreadCountOnConnected?: boolean;
  showToast?: boolean;
  onReceive?: (payload: NotificationSocketPayload) => void;
}

const getLastSeenAt = () => {
  return localStorage.getItem(LAST_SEEN_STORAGE_KEY);
};

const setLastSeenAt = (value: string) => {
  localStorage.setItem(LAST_SEEN_STORAGE_KEY, value);
};

const useNotifications = (options?: UseNotificationsOptions) => {
  const {
    enabled = true,
    listenSocket = true,
    autoSyncOnConnected = true,
    syncMissedOnConnected = true,
    syncUnreadCountOnConnected = true,
    showToast = true,
    onReceive,
  } = options || {};

  const { notification } = App.useApp();
  const { status } = useSocket();
  const dispatch = useAppDispatch();
  const unreadCountFromStore = useAppSelector((state) => state.notification.unreadCount);

  const [unreadCount, setLocalUnreadCount] = useState<number>(unreadCountFromStore);

  useEffect(() => {
    publishUnreadCount(unreadCountFromStore);
  }, [unreadCountFromStore]);

  const setUnreadCount = useCallback(
    (next: SetStateAction<number>) => {
      let nextValue = 0;

      if (typeof next === "function") {
        const updater = next as (prevState: number) => number;
        nextValue = updater(unreadCountCache);
      } else {
        nextValue = next;
      }

      dispatch(setUnreadCountAction(Math.max(0, nextValue)));
    },
    [dispatch],
  );

  const applyRealtimePayload = useCallback(
    (payload: NotificationSocketPayload) => {
      const eventKey = `${payload.id}:${payload.createdAt}:${payload.isRead ? 1 : 0}`;
      if (shouldSkipDuplicateEvent(eventKey)) {
        return;
      }

      dispatch(
        upsertNotificationItem({
          ...payload,
          createdAt: payload.createdAt || new Date().toISOString(),
        }),
      );

      if (!payload.isRead) {
        dispatch(incrementUnreadCount());
      }

      onReceive?.(payload);

      setLastSeenAt(payload.createdAt || new Date().toISOString());

      if (showToast) {
        notification.open({
          message: "Bạn có thông báo mới",
          description: "Nhấn vào Hoạt động để xem chi tiết.",
          duration: 3,
          placement: "topRight",
        });
      }
    },
    [dispatch, notification, onReceive, showToast],
  );

  /**
   * Handle aggregated notification update (post_like).
   * Converts the payload into an INotificationItem with actors + totalActorCount,
   * then upserts it into the store maintaining the latest actor at the front.
   */
  const applyAggregatedPayload = useCallback(
    (payload: AggregatedNotificationPayload) => {
      const eventKey = `agg:${payload.id}:${payload.totalActorCount}`;
      if (shouldSkipDuplicateEvent(eventKey)) return;

      dispatch(
        upsertNotificationItem({
          id: payload.id,
          type: payload.type,
          actor: payload.actor,
          actors: [payload.actor],
          totalActorCount: payload.totalActorCount,
          targetId: payload.targetId,
          isRead: payload.isRead,
          createdAt: payload.createdAt || new Date().toISOString(),
        }),
      );

      setLastSeenAt(payload.createdAt || new Date().toISOString());

      if (showToast) {
        notification.open({
          message: "Bạn có thông báo mới",
          description: "Nhấn vào Hoạt động để xem chi tiết.",
          duration: 3,
          placement: "topRight",
        });
      }
    },
    [dispatch, notification, showToast],
  );

  const syncMissedNotifications = useCallback(async () => {
    try {
      const result = await dispatch(
        getNotificationsAction({
          since: getLastSeenAt() || undefined,
          limit: 30,
        }),
      ).unwrap();

      result.items.forEach((item) => {
        if (item.actor) onReceive?.(item as any);
      });

      const latestCreatedAt = result.items
        .map((item) => item.createdAt)
        .sort((a, b) => (a > b ? -1 : 1))[0];

      if (latestCreatedAt) {
        setLastSeenAt(latestCreatedAt);
      }
    } catch (error) {
      console.error("Failed to sync missed notifications", error);
    }
  }, [dispatch, onReceive]);

  const syncUnreadCount = useCallback(async () => {
    try {
      await dispatch(getUnreadCountAction()).unwrap();
    } catch (error) {
      console.error("Failed to sync unread count", error);
    }
  }, [dispatch]);

  const handleUnreadCountEvent = useCallback(
    (payload: NotificationUnreadCountPayload) => {
      dispatch(setUnreadCountAction(Math.max(0, Number(payload.unreadCount || 0))));
    },
    [dispatch],
  );

  const handleReadEvent = useCallback(
    (payload: NotificationReadPayload) => {
      sharedReadIds.add(payload.notificationId);
      dispatch(markNotificationAsReadLocal(payload.notificationId));
    },
    [dispatch],
  );

  const handleReadAllEvent = useCallback(() => {
    dispatch(setUnreadCountAction(0));
  }, [dispatch]);

  const markOneAsRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId || sharedReadIds.has(notificationId)) {
        return;
      }

      const result = await dispatch(markNotificationAsReadAction(notificationId)).unwrap();
      sharedReadIds.add(notificationId);
      dispatch(markNotificationAsReadLocal(notificationId));
      dispatch(setUnreadCountAction(result.unreadCount));
    },
    [dispatch],
  );

  const markAllAsRead = useCallback(async () => {
    const previousUnread = unreadCountCache;
    dispatch(setUnreadCountAction(0));

    try {
      const result = await dispatch(markAllNotificationsAsReadAction()).unwrap();
      dispatch(setUnreadCountAction(result.unreadCount));
    } catch {
      dispatch(setUnreadCountAction(previousUnread));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!enabled || !listenSocket) {
      return;
    }

    const socket = getSocket();

    socket.off("notification:new", applyRealtimePayload);
    socket.on("notification:new", applyRealtimePayload);
    socket.off("notification:updated", applyAggregatedPayload);
    socket.on("notification:updated", applyAggregatedPayload);
    socket.off("notification:unread-count", handleUnreadCountEvent);
    socket.on("notification:unread-count", handleUnreadCountEvent);
    socket.off("notification:read", handleReadEvent);
    socket.on("notification:read", handleReadEvent);
    socket.off("notification:read-all", handleReadAllEvent);
    socket.on("notification:read-all", handleReadAllEvent);

    return () => {
      socket.off("notification:new", applyRealtimePayload);
      socket.off("notification:updated", applyAggregatedPayload);
      socket.off("notification:unread-count", handleUnreadCountEvent);
      socket.off("notification:read", handleReadEvent);
      socket.off("notification:read-all", handleReadAllEvent);
    };
  }, [
    applyAggregatedPayload,
    applyRealtimePayload,
    enabled,
    handleReadAllEvent,
    handleReadEvent,
    handleUnreadCountEvent,
    listenSocket,
  ]);

  useEffect(() => {
    const unsubscribe = subscribeUnreadCount(setLocalUnreadCount);
    setLocalUnreadCount(unreadCountCache);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!enabled || !autoSyncOnConnected || status !== "connected") {
      return;
    }

    if (!syncMissedOnConnected && !syncUnreadCountOnConnected) {
      return;
    }

    if (autoSyncInFlight) {
      return;
    }

    const now = Date.now();
    if (now - lastAutoSyncAt < AUTO_SYNC_COOLDOWN_MS) {
      return;
    }

    autoSyncInFlight = (async () => {
      const tasks: Promise<unknown>[] = [];

      if (syncMissedOnConnected) {
        tasks.push(syncMissedNotifications());
      }

      if (syncUnreadCountOnConnected) {
        tasks.push(syncUnreadCount());
      }

      await Promise.all(tasks);
      lastAutoSyncAt = Date.now();
    })().finally(() => {
      autoSyncInFlight = null;
    });
  }, [
    autoSyncOnConnected,
    enabled,
    status,
    syncMissedNotifications,
    syncUnreadCount,
    syncMissedOnConnected,
    syncUnreadCountOnConnected,
  ]);

  return useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      syncMissedNotifications,
      syncUnreadCount,
      markOneAsRead,
      markAllAsRead,
    }),
    [
      markAllAsRead,
      markOneAsRead,
      setUnreadCount,
      syncMissedNotifications,
      syncUnreadCount,
      unreadCount,
    ],
  );
};

export { useNotifications };
