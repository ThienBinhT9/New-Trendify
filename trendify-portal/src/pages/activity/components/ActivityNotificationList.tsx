import { Flex } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import EmptyState from "@/container/empty/EmptyState";
import Icon from "@/components/icon/Icon";

import type { ActivityNotification } from "../activity.types";
import type { ActivityTabKey } from "../activityTabs";
import { getMockActivityFeed } from "../activity.mock";

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
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  const hasFetchedRef = useRef<boolean>(false);

  const fetchNotifications = useCallback(
    async (nextCursor: number) => {
      try {
        setIsLoading(true);

        const response = await getMockActivityFeed({
          tab: tabKey,
          cursor: nextCursor,
        });

        setNotifications((prev) =>
          nextCursor === 0 ? response.data : [...prev, ...response.data],
        );
        setCursor(response.cursor);
        setHasNext(response.hasNext);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [tabKey],
  );

  useEffect(() => {
    if ((!isActive && !prefetch) || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchNotifications(0);
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
              <ActivityNotificationItem notification={item} />
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
          onCtaClick={() => fetchNotifications(0)}
        />
      )}
    </Flex>
  );
};

export default ActivityNotificationList;
