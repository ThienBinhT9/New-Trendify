import { Flex } from "antd";
import { useNavigate } from "react-router-dom";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNotifications } from "@/hooks";
import { useAppDispatch, useAppSelector } from "@/stores";
import { getNotificationsAction } from "@/stores/notification/actions";
import { upsertNotificationItem } from "@/stores/notification/slice";
import type { INotificationItem } from "@/stores/notification/constants";
import type { ActivityNotification, ActivityTabKey } from "../activity.types";
import {
  getSocket,
  type NotificationSocketPayload,
  type AggregatedNotificationPayload,
} from "@/services/socket";
import {
  resolveNavigatePath,
  writeActivityScrollTop,
  getActivityScrollPosition,
  mapNotificationToActivity,
  setActivityScrollPosition,
} from "../activity.helper";
import {
  FETCH_LIMIT,
  SCROLL_PARENT_ID,
  EMPTY_STATE_TITLE,
  EMPTY_STATE_DESCRIPTION,
} from "../activity.constants";

import Icon from "@/components/icon/Icon";
import EmptyState from "@/container/empty/EmptyState";
import ActivityNotificationItem from "./ActivityNotificationItem";
import ActivityNotificationSkeleton from "./ActivityNotificationSkeleton";

interface ActivityNotificationListProps {
  tabKey: ActivityTabKey;
  isActive?: boolean;
}

const ActivityNotificationList = ({ tabKey, isActive = true }: ActivityNotificationListProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const hasAttemptedFetch = useRef(false);

  const tabData = useAppSelector((state) => state.notification[tabKey]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  const notifications = useMemo(
    () => tabData.items.map(mapNotificationToActivity),
    [tabData.items],
  );

  const fetchNotifications = useCallback(
    async (nextCursor: string | null) => {
      setIsLoading(true);
      try {
        await dispatch(
          getNotificationsAction({
            cursor: nextCursor ?? undefined,
            limit: FETCH_LIMIT,
            isRead: tabKey === "unread" ? false : undefined,
          }),
        ).unwrap();
      } catch (error) {
        console.error(`[ActivityList][${tabKey}] fetch error:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, tabKey],
  );

  // Restore scroll position when tab becomes active
  useEffect(() => {
    if (isActive && scrollParent) {
      const savedPos = getActivityScrollPosition(tabKey);
      writeActivityScrollTop(savedPos);
    }
  }, [isActive, scrollParent, tabKey]);

  // Initial fetch logic
  useEffect(() => {
    if (!isActive || hasAttemptedFetch.current) return;

    if (tabData.items.length > 0 && tabData.cursor !== null) {
      hasAttemptedFetch.current = true;
      return;
    }

    hasAttemptedFetch.current = true;
    fetchNotifications(null);
  }, [isActive, tabData.items.length, tabData.cursor, fetchNotifications]);

  // Scroll position sync
  useEffect(() => {
    const parent = document.getElementById(SCROLL_PARENT_ID);
    if (!parent) return;
    setScrollParent(parent);

    const handleScroll = () => {
      if (isActive) {
        setActivityScrollPosition(tabKey, parent.scrollTop);
      }
    };

    if (isActive) {
      parent.addEventListener("scroll", handleScroll);
    }
    return () => {
      parent.removeEventListener("scroll", handleScroll);
    };
  }, [isActive, tabKey]);

  // Sockets
  const handleRealtimeReceive = useCallback(
    (payload: NotificationSocketPayload) => {
      dispatch(upsertNotificationItem(payload as INotificationItem));
    },
    [dispatch],
  );

  const handleAggregatedReceive = useCallback(
    (payload: AggregatedNotificationPayload) => {
      const item: INotificationItem = {
        id: payload.id,
        type: payload.type,
        actor: payload.actor,
        actors: [payload.actor],
        totalActorCount: payload.totalActorCount,
        targetId: payload.targetId,
        isRead: payload.isRead,
        createdAt: payload.createdAt,
      };
      dispatch(upsertNotificationItem(item));
    },
    [dispatch],
  );

  const { markOneAsRead, setUnreadCount } = useNotifications({
    showToast: false,
    enabled: false,
    listenSocket: false,
    autoSyncOnConnected: false,
    syncMissedOnConnected: false,
    syncUnreadCountOnConnected: false,
  });

  useEffect(() => {
    if (!isActive) return;
    const socket = getSocket();
    socket.off("notification:new", handleRealtimeReceive);
    socket.on("notification:new", handleRealtimeReceive);
    socket.off("notification:updated", handleAggregatedReceive);
    socket.on("notification:updated", handleAggregatedReceive);
    return () => {
      socket.off("notification:new", handleRealtimeReceive);
      socket.off("notification:updated", handleAggregatedReceive);
    };
  }, [handleRealtimeReceive, handleAggregatedReceive, isActive]);

  const addPendingRead = (id: string) => {
    return setPendingReadIds((prev) => new Set(prev).add(id));
  };

  const removePendingRead = (id: string) => {
    return setPendingReadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((item) => item.id === notificationId);
      if (!target || target.isRead || pendingReadIds.has(notificationId)) return;

      addPendingRead(notificationId);
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markOneAsRead(notificationId);
      } catch {
        setUnreadCount((prev) => prev + 1);
      } finally {
        removePendingRead(notificationId);
      }
    },
    [markOneAsRead, notifications, pendingReadIds, setUnreadCount],
  );

  const handleNotificationClick = useCallback(
    (item: ActivityNotification) => {
      if (!item.isRead) void handleMarkAsRead(item.id);
      navigate(resolveNavigatePath(item));
    },
    [handleMarkAsRead, navigate],
  );

  const isInitialLoading = isLoading && notifications.length === 0;

  if (isInitialLoading) {
    return (
      <Flex className="activity-page__list-wrapper">
        <ActivityNotificationSkeleton className="activity-page__skeleton" count={5} />
      </Flex>
    );
  }

  if (notifications.length === 0) {
    return (
      <Flex className="activity-page__list-wrapper">
        <EmptyState
          variant="gray"
          icon={<Icon name="NotificationIcon" size={28} />}
          title={EMPTY_STATE_TITLE[tabKey]}
          description={EMPTY_STATE_DESCRIPTION[tabKey]}
          ctaLabel="Làm mới"
          onCtaClick={() => fetchNotifications(null)}
        />
      </Flex>
    );
  }

  return (
    <Flex className="activity-page__list-wrapper">
      <Virtuoso
        ref={virtuosoRef}
        customScrollParent={isActive ? (scrollParent ?? undefined) : undefined}
        data={notifications}
        className="activity-page__list"
        style={{ height: "100%" }}
        overscan={320}
        computeItemKey={(_, item) => item.id}
        endReached={() => {
          if (isActive && tabData.hasNext && !isLoading) fetchNotifications(tabData.cursor);
        }}
        itemContent={(_, item) => (
          <div className="activity-page__list-item">
            <ActivityNotificationItem
              notification={item}
              isPendingRead={pendingReadIds.has(item.id)}
              onClick={() => handleNotificationClick(item)}
            />
          </div>
        )}
        components={{
          Footer: () => (
            <div>
              {isLoading && <ActivityNotificationSkeleton count={2} />}
              <div className="list-bottom-spacer" />
            </div>
          ),
        }}
      />
    </Flex>
  );
};

export default ActivityNotificationList;
