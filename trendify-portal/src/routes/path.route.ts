export const SUB_PATH_PROFILE = {
  INTRODUCE: "directory_intro",
  PERSONAL_DETAIL: "directory_personal_detail",
  FRIENDS: "friends",
  FOLLOWERS: "followers",
  FOLLOWING: "following",
  IMAGES: "images",
  VIDEOS: "videos",
};

export const SUB_PATH_SETTINGS = {
  PRIVACY: "privacy",
  ACCOUNT: "account",
  MENTIONS: "mentions",
  PROFILE_PRIVACY: "profile-privacy",
  ONLINE_STATUS: "online-status",
  BLOCKED: "blocked",
  HIDE_COUNTS: "hide-counts",
};

const ROUTE_PATHS = {
  SIGN_IN: "/sign-in",
  SIGN_UP_START: "/sign-up",
  REQUEST_EMAIL_VERIFICATION: "/verify-email",
  VERIFY_EMAIL_CALLBACK: "/sign-up/verify/callback",
  SIGN_UP_COMPLETE: "/sign-up/complete",
  RESET_PASSWORD: "/reset-password",
  WELCOME: "/welcome",
  HOME: "/",
  ACTIVITY: "/activity",

  FOLLOWING: "/following",
  MESSAGE: "/message",

  //SEARCH
  SEARCH: "/search",

  //NOTIFICATIONS
  NOTIFICATIONS: "/notifications",

  SETTINGS: "/settings",
  SETTINGS_SECTION: (key = ":key") => `/settings/${key}`,

  //PROFILE
  PROFILE: (id = ":id") => `/profile/${id}/`,
  PROFILE_INTRODUCE: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.INTRODUCE}`,
  PROFILE_PERSONAL_DETAIL: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.PERSONAL_DETAIL}`,
  PROFILE_FRIENDS: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.FRIENDS}`,
  PROFILE_FOLLOWING: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.FOLLOWING}`,
  PROFILE_FOLLOWERS: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.FOLLOWERS}`,
  PROFILE_IMAGES: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.IMAGES}`,
  PROFILE_VIDEOS: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.VIDEOS}`,
};
export default ROUTE_PATHS;
