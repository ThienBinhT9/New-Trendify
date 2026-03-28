import { Avatar, Flex } from "antd";
import { memo } from "react";

import Button from "@/components/button/Button";
import Icon from "@/components/icon/Icon";

import type { ActivityNotification } from "../activity.types";
import Text from "@/components/text/Text";
import { formatTimeFromNow } from "@/utils/common.util";

interface ActivityNotificationItemProps {
  notification: ActivityNotification;
  isPendingRead?: boolean;
  onClick?: () => void;
}

const ActivityNotificationItem = ({
  notification,
  isPendingRead = false,
  onClick,
}: ActivityNotificationItemProps) => {
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
              style={{ backgroundColor: actor.avatarBg, color: actor.avatarColor }}
              src={actor.avatarUrl}
            >
              {actor.initials}
            </Avatar>
          ))}
        </Flex>

        <Flex vertical className="activity-notification-item__content">
          {!notification.isRead && <span className="activity-notification-item__unread-dot" />}
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
        <Text textType="M10">{relativeTimeLabel}</Text>

        {notification.actionType === "follow" ? (
          <Button className="activity-notification-item__follow-btn">
            {notification.followLabel}
          </Button>
        ) : null}

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
