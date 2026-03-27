import type { ActivityTabKey } from "./activityTabs";

const activityScrollPositions: Record<ActivityTabKey, number> = {
  all: 0,
  following: 0,
  mentions: 0,
};

const getActivityScrollElement = () => {
  return document.getElementById("mainLayoutChildren");
};

const getScrollableRoot = () => {
  return document.scrollingElement ?? document.documentElement;
};

export const getActivityScrollPosition = (key: ActivityTabKey) => {
  return activityScrollPositions[key] ?? 0;
};

export const setActivityScrollPosition = (key: ActivityTabKey, value: number) => {
  activityScrollPositions[key] = value;
};

export const readActivityScrollTop = () => {
  const element = getActivityScrollElement();

  if (element && element.scrollHeight > element.clientHeight) {
    return element.scrollTop;
  }

  return getScrollableRoot().scrollTop;
};

export const writeActivityScrollTop = (value: number) => {
  const element = getActivityScrollElement();

  if (element && element.scrollHeight > element.clientHeight) {
    element.scrollTop = value;
    return;
  }

  window.scrollTo({ top: value, left: 0 });
};
