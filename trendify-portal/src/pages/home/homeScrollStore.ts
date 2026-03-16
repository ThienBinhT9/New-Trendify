type HomeTabKey = "forYou" | "following";

const scrollPositions: Record<HomeTabKey, number> = {
  forYou: 0,
  following: 0,
};

export const getHomeScrollPosition = (key: HomeTabKey) => scrollPositions[key] ?? 0;

export const setHomeScrollPosition = (key: HomeTabKey, value: number) => {
  scrollPositions[key] = value;
};

export const getHomeScrollElement = () => {
  return document.getElementById("mainLayoutChildren");
};

const getScrollableRoot = () => {
  return document.scrollingElement ?? document.documentElement;
};

export const readHomeScrollTop = () => {
  const el = getHomeScrollElement();
  if (el && el.scrollHeight > el.clientHeight) {
    return el.scrollTop;
  }
  return getScrollableRoot().scrollTop;
};

export const writeHomeScrollTop = (value: number) => {
  const el = getHomeScrollElement();
  if (el && el.scrollHeight > el.clientHeight) {
    el.scrollTop = value;
    return;
  }
  window.scrollTo({ top: value, left: 0 });
};

export type { HomeTabKey };
