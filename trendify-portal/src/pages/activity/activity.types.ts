import { INotificationActor } from "@/stores/notification/constants";

export type ActivityEventType = "like" | "follow" | "reply" | "repost" | "mention";
export type ActivityCategory = ActivityTabKey;
export type ActivityActionType = "none" | "follow" | "media";
export type ActivityTabKey = "all" | "unread";

export interface ActivityNotification {
  id: string;
  sourceType: "post_like" | "post_comment" | "post_mention" | "follow" | "follow_request";
  actorId: string;
  targetId: string;
  referenceId?: string;
  category: ActivityCategory;
  type: ActivityEventType;
  isRead: boolean;
  actors: INotificationActor[];
  totalActorCount: number;
  actorSummary: string;
  actionText: string;
  previewText?: string;
  actionType: ActivityActionType;
  followLabel?: string;
  mediaUrl?: string;
  createdAt: string;
  timeLabel: string;
}
