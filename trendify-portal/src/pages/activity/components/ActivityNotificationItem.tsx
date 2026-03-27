import { Avatar, Flex } from "antd";
import { type ComponentProps, memo } from "react";

import Button from "@/components/button/Button";
import Icon from "@/components/icon/Icon";

import type { ActivityEventType, ActivityNotification } from "../activity.types";
import Text from "@/components/text/Text";

type IconName = ComponentProps<typeof Icon>["name"];

type ActivityBadge = {
  icon: IconName;
  toneClass: string;
};

const badgeConfig: Record<ActivityEventType, ActivityBadge> = {
  like: { icon: "HeartDecorationIcon", toneClass: "activity-notification-item__badge--like" },
  follow: { icon: "UserWhiteIcon", toneClass: "activity-notification-item__badge--follow" },
  reply: { icon: "CommentIcon", toneClass: "activity-notification-item__badge--reply" },
  repost: { icon: "ShareIcon", toneClass: "activity-notification-item__badge--repost" },
  mention: { icon: "MessageCircleIcon", toneClass: "activity-notification-item__badge--mention" },
};

interface ActivityNotificationItemProps {
  notification: ActivityNotification;
}

const ActivityNotificationItem = ({ notification }: ActivityNotificationItemProps) => {
  const badge = badgeConfig[notification.type];
  const visibleActors = notification.actors.slice(0, 2);

  return (
    <Flex className="activity-notification-item" align="flex-start" justify="space-between">
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
            >
              {actor.initials}
            </Avatar>
          ))}

          <Flex className={`activity-notification-item__badge ${badge.toneClass}`}>
            <Icon name={badge.icon} size={10} />
          </Flex>
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
        <Text textType="M14">{notification.timeLabel}</Text>

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
