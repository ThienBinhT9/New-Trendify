import type { ActivityNotification, ActivityTabKey } from "./activity.types";
import { INotificationActor, INotificationItem } from "@/stores/notification/constants";
import { ACTION_TEXT } from "./activity.constants";
import { NotificationSocketPayload } from "@/services/socket";
import ROUTE_PATHS from "@/routes/path.route";

const scrollPositions: Record<ActivityTabKey, number> = {
  all: 0,
  unread: 0,
};

export const getActivityScrollPosition = (key: ActivityTabKey) => scrollPositions[key] ?? 0;

export const setActivityScrollPosition = (key: ActivityTabKey, value: number) => {
  scrollPositions[key] = value;
};

export const getActivityScrollElement = () => {
  return document.getElementById("mainLayoutChildren");
};

const getScrollableRoot = () => {
  return document.scrollingElement ?? document.documentElement;
};

export const readActivityScrollTop = () => {
  const el = getActivityScrollElement();
  if (el && el.scrollHeight > el.clientHeight) {
    return el.scrollTop;
  }
  return getScrollableRoot().scrollTop;
};

export const writeActivityScrollTop = (value: number) => {
  const el = getActivityScrollElement();
  if (el && el.scrollHeight > el.clientHeight) {
    el.scrollTop = value;
    return;
  }
  window.scrollTo({ top: value, left: 0 });
};

export function isFollowType(type: string): boolean {
  return type === "follow" || type === "follow_request";
}

export function buildActorSummary(actors: INotificationActor[], totalCount: number): string {
  if (actors.length === 0) return "Ai đó";
  if (totalCount === 1) return actors[0].displayName;
  if (totalCount === 2 && actors.length >= 2) {
    return `${actors[0].displayName} và ${actors[1].displayName}`;
  }
  if (actors.length >= 2) {
    const othersCount = totalCount - 2;
    return `${actors[0].displayName}, ${actors[1].displayName} và ${othersCount} người khác`;
  }
  const othersCount = totalCount - 1;
  return `${actors[0].displayName} và ${othersCount} người khác`;
}

export const resolveNavigatePath = (item: ActivityNotification) => {
  if (isFollowType(item.sourceType)) {
    return ROUTE_PATHS.PROFILE(item.actorId);
  }
  return ROUTE_PATHS.POST_DETAIL(item.targetId);
};

export function mapNotificationToActivity(
  item: INotificationItem | NotificationSocketPayload,
): ActivityNotification {
  const { id, type, targetId, referenceId, isRead, createdAt } = item;
  const followNotification = isFollowType(type);
  const itemWithActors = item as INotificationItem;
  const totalActorCount = itemWithActors.totalActorCount ?? 1;

  let activityActors: INotificationActor[];
  if (itemWithActors.actors && itemWithActors.actors.length > 0) {
    activityActors = itemWithActors.actors;
  } else if (item.actor) {
    activityActors = [item.actor];
  } else {
    activityActors = [];
  }

  const primaryActor = item.actor ?? itemWithActors.actors?.[0] ?? null;
  const primaryActorId = primaryActor?.id ?? "";

  return {
    id,
    sourceType: type,
    actorId: primaryActorId,
    targetId,
    referenceId,
    category: "all",
    type:
      type === "post_like"
        ? "like"
        : type === "post_comment"
          ? "reply"
          : followNotification
            ? "follow"
            : "mention",
    isRead,
    actors: activityActors,
    totalActorCount,
    actorSummary: buildActorSummary(activityActors, totalActorCount),
    actionText: ACTION_TEXT[type] ?? ACTION_TEXT,
    previewText: undefined,
    actionType: followNotification ? "follow" : "none",
    mediaUrl: undefined,
    createdAt,
    timeLabel: createdAt,
  };
}
