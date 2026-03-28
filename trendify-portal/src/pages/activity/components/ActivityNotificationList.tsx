import { Flex } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import EmptyState from "@/container/empty/EmptyState";
import Icon from "@/components/icon/Icon";
import { useNotifications } from "@/hooks";
import { useAppDispatch } from "@/stores";
import { getNotificationsAction } from "@/stores/notification/actions";
import type { INotificationItem } from "@/stores/notification/constants";
import ROUTE_PATHS from "@/routes/path.route";
import type { NotificationSocketPayload } from "@/services/socket";

import type { ActivityNotification } from "../activity.types";
import type { ActivityTabKey } from "../activityTabs";

import ActivityNotificationItem from "./ActivityNotificationItem";
import ActivityNotificationSkeleton from "./ActivityNotificationSkeleton";

interface ActivityNotificationListProps {
  tabKey: ActivityTabKey;
  isActive?: boolean;
  prefetch?: boolean;
}

const ActivityNotificationList = ({
  tabKey,
  isActive = true,
  prefetch = false,
}: ActivityNotificationListProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());

  const hasFetchedRef = useRef<boolean>(false);

  const formatTimeLabel = (createdAt: string) => {
    const now = Date.now();
    const target = new Date(createdAt).getTime();
    const diffInMinutes = Math.max(1, Math.floor((now - target) / 60000));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }

    return `${Math.floor(diffInDays / 7)}w`;
  };

  const resolveDisplayName = (actorId?: string, displayName?: string, username?: string) => {
    if (displayName && displayName.trim().length > 0) {
      return displayName;
    }

    if (username && username.trim().length > 0) {
      return username;
    }

    if (actorId) {
      return `user.${actorId.slice(-6)}`;
    }

    return "user";
  };

  const resolveInitials = (name: string, actorId?: string) => {
    const parts = name
      .split(" ")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length > 0) {
      return parts
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    }

    return actorId ? actorId.slice(-2).toUpperCase() : "";
  };

  const mapNotificationToActivity = useCallback(
    (item: INotificationItem | NotificationSocketPayload): ActivityNotification => {
      const actorId = item.actor.id;
      const displayName = resolveDisplayName(actorId, item.actor.displayName, item.actor.username);
      const initials = resolveInitials(displayName, actorId);
      const avatarUrl = item.actor.profilePicture?.small || item.actor.profilePicture?.original;

      const mappedType =
        item.type === "post_like"
          ? "like"
          : item.type === "post_comment"
            ? "reply"
            : item.type === "follow"
              ? "follow"
              : "mention";

      const derivedCategory = item.type === "post_mention" ? "mentions" : "following";

      return {
        id: item.id,
        sourceType: item.type,
        actorId,
        targetId: item.targetId,
        referenceId: item.referenceId,
        category: derivedCategory,
        type: mappedType,
        isRead: item.isRead,
        actors: [
          {
            id: actorId,
            displayName,
            initials,
            avatarUrl,
            avatarBg: "#dceafb",
            avatarColor: "#1f5b96",
          },
        ],
        actorSummary: displayName,
        actionText:
          item.type === "post_like"
            ? "đã thích bài viết của bạn."
            : item.type === "post_comment"
              ? "đã bình luận bài viết của bạn."
              : item.type === "follow"
                ? "đã bắt đầu theo dõi bạn."
                : "đã nhắc đến bạn trong một bình luận.",
        previewText: undefined,
        actionType: item.type === "follow" ? "follow" : "none",
        followLabel: item.type === "follow" ? "Theo dõi" : undefined,
        mediaUrl: undefined,
        createdAt: item.createdAt,
        timeLabel: formatTimeLabel(item.createdAt),
      };
    },
    [],
  );

  const filterByTab = useCallback(
    (items: ActivityNotification[]) => {
      if (tabKey === "all") {
        return items;
      }

      if (tabKey === "mentions") {
        return items.filter((item) => item.category === "mentions");
      }

      return items.filter((item) => item.category === "following");
    },
    [tabKey],
  );

  const handleRealtimeReceive = useCallback(
    (payload: NotificationSocketPayload) => {
      const mapped = mapNotificationToActivity(payload);

      setNotifications((prev) => {
        const withoutDuplicate = prev.filter((item) => item.id !== mapped.id);
        return filterByTab([mapped, ...withoutDuplicate]);
      });
    },
    [filterByTab, mapNotificationToActivity],
  );

  const { markOneAsRead, setUnreadCount } = useNotifications({
    showToast: false,
    enabled: isActive,
    autoSyncOnConnected: false,
    onReceive: handleRealtimeReceive,
  });

  const fetchNotifications = useCallback(
    async (nextCursor: string | null) => {
      try {
        setIsLoading(true);

        const response = await dispatch(
          getNotificationsAction({
            cursor: nextCursor || undefined,
            limit: 20,
          }),
        ).unwrap();

        const mapped = filterByTab(response.items.map(mapNotificationToActivity));

        setNotifications((prev) => (nextCursor ? [...prev, ...mapped] : mapped));
        setCursor(response.cursor);
        setHasNext(response.hasNext);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, filterByTab, mapNotificationToActivity],
  );

  useEffect(() => {
    if ((!isActive && !prefetch) || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchNotifications(null);
  }, [fetchNotifications, isActive, prefetch]);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const isInitialLoading = isLoading && notifications.length === 0;

  const getEmptyStateDescription = () => {
    if (tabKey === "following") {
      return "Hiện chưa có lượt theo dõi mới";
    }

    if (tabKey === "mentions") {
      return "Hiện chưa có lượt nhắc mới";
    }

    return "Hoạt động của bạn sẽ xuất hiện ở đây";
  };

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      const targetItem = notifications.find((item) => item.id === notificationId);

      if (!targetItem || targetItem.isRead || pendingReadIds.has(notificationId)) {
        return;
      }

      setPendingReadIds((prev) => {
        const next = new Set(prev);
        next.add(notificationId);
        return next;
      });

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markOneAsRead(notificationId);
      } catch {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? {
                  ...item,
                  isRead: false,
                }
              : item,
          ),
        );
        setUnreadCount((prev) => prev + 1);
      } finally {
        setPendingReadIds((prev) => {
          const next = new Set(prev);
          next.delete(notificationId);
          return next;
        });
      }
    },
    [markOneAsRead, notifications, pendingReadIds, setUnreadCount],
  );

  const resolveNavigatePath = useCallback((item: ActivityNotification) => {
    if (item.sourceType === "follow") {
      return ROUTE_PATHS.PROFILE(item.actorId);
    }

    return ROUTE_PATHS.POST_DETAIL(item.targetId);
  }, []);

  const handleNotificationClick = useCallback(
    (item: ActivityNotification) => {
      const destination = resolveNavigatePath(item);

      if (!item.isRead) {
        void handleMarkAsRead(item.id);
      }

      navigate(destination);
    },
    [handleMarkAsRead, navigate, resolveNavigatePath],
  );

  return (
    <Flex className="activity-page__list-wrapper">
      {isInitialLoading ? (
        <ActivityNotificationSkeleton className="activity-page__skeleton" count={5} />
      ) : notifications.length > 0 ? (
        <Virtuoso
          customScrollParent={scrollParent ?? undefined}
          data={notifications}
          className="activity-page__list"
          style={{ height: "100%" }}
          overscan={320}
          computeItemKey={(_, item) => item.id}
          endReached={() => {
            if (!isActive || !hasNext || isLoading) {
              return;
            }

            fetchNotifications(cursor);
          }}
          itemContent={(_, item) => (
            <div className="activity-page__list-item">
              <ActivityNotificationItem
                notification={item}
                isPendingRead={pendingReadIds.has(item.id)}
                onClick={() => {
                  handleNotificationClick(item);
                }}
              />
            </div>
          )}
          components={{
            Footer: () => (
              <div>
                {isLoading ? <ActivityNotificationSkeleton count={2} /> : null}
                <div className="list-bottom-spacer" />
              </div>
            ),
          }}
        />
      ) : (
        <EmptyState
          variant="gray"
          icon={<Icon name="NotificationIcon" size={28} />}
          title="Chưa có hoạt động"
          description={getEmptyStateDescription()}
          ctaLabel="Làm mới"
          onCtaClick={() => fetchNotifications(null)}
        />
      )}
    </Flex>
  );
};

export default ActivityNotificationList;
