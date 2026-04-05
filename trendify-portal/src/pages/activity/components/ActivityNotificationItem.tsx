import { Avatar, Flex } from "antd";
import { memo } from "react";

import type { ActivityNotification } from "../activity.types";
import { formatTimeFromNow, getAvatarUrl } from "@/utils/common.util";

import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";

interface ActivityNotificationItemProps {
  notification: ActivityNotification;
  isPendingRead?: boolean;
  onClick?: () => void;
}

const ActivityNotificationItem = (props: ActivityNotificationItemProps) => {
  const { notification, isPendingRead = false, onClick } = props;

  const visibleActors = notification.actors.slice(0, 2);
  const relativeTimeLabel = formatTimeFromNow(notification.createdAt);

  return (
    <Flex
      className={`activity-notification-item ${notification.isRead ? "" : "activity-notification-item--unread"} ${
        isPendingRead ? "activity-notification-item--pending" : ""
      }`}
      align="flex-start"
      justify="space-between"
      onClick={onClick}
    >
      <Flex className="activity-notification-item__main" align="center">
        <Flex
          className={`activity-notification-item__actors ${
            visibleActors.length > 1 ? "activity-notification-item__actors--stacked" : ""
          }`}
        >
          {visibleActors.map((actor, index) => (
            <Avatar
              key={`${notification.id}-${actor.id}`}
              className={`activity-notification-item__avatar activity-notification-item__avatar--${index}`}
              src={getAvatarUrl(actor.profilePicture)}
            />
          ))}
        </Flex>
        <Flex vertical className="activity-notification-item__content">
          <p
            className="activity-notification-item__title"
            title={`${notification.actorSummary} ${notification.actionText}`}
          >
            <span className="activity-notification-item__actor-text">
              {notification.actorSummary}
            </span>{" "}
            <span>{notification.actionText}</span>
          </p>

          {notification.previewText && (
            <p className="activity-notification-item__preview">{notification.previewText}</p>
          )}
        </Flex>
      </Flex>

      <Flex vertical align="flex-end" className="activity-notification-item__meta">
        <Text textType="R12" className="activity-notification-item__time">
          {relativeTimeLabel}
        </Text>

        {notification.actionType === "media" ? (
          <Flex className="activity-notification-item__thumb">
            {notification.mediaUrl ? (
              <img src={notification.mediaUrl} alt="notification-thumbnail" />
            ) : (
              <Icon name="ImagePenIcon" size={24} />
            )}
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default memo(ActivityNotificationItem);
