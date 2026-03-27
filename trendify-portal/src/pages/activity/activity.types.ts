import type { ActivityTabKey } from "./activityTabs";

export type ActivityEventType = "like" | "follow" | "reply" | "repost" | "mention";
export type ActivityCategory = Exclude<ActivityTabKey, "all">;
export type ActivityActionType = "none" | "follow" | "media";

export interface ActivityActor {
  id: string;
  displayName: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
}

export interface ActivityNotification {
  id: string;
  category: ActivityCategory;
  type: ActivityEventType;
  actors: ActivityActor[];
  actorSummary: string;
  actionText: string;
  previewText?: string;
  actionType: ActivityActionType;
  followLabel?: string;
  mediaUrl?: string;
  createdAt: string;
  timeLabel: string;
}

export interface GetActivityFeedParams {
  tab: ActivityTabKey;
  cursor?: number;
  limit?: number;
}

export interface ActivityFeedResult {
  data: ActivityNotification[];
  cursor: number;
  hasNext: boolean;
}
