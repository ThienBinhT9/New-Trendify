export const SUB_PATH_PROFILE = {
  INTRODUCE: "directory_intro",
  PERSONAL_DETAIL: "directory_personal_detail",
  FRIENDS: "friends",
  FOLLOWERS: "followers",
  FOLLOWING: "following",
  IMAGES: "images",
  VIDEOS: "videos",
  DRAFTS: "drafts",
  SAVED: "saved",
};

export const SUB_PATH_SEARCH = {
  PEOPLE: "people",
  POSTS: "posts",
  HASHTAGS: "hashtags",
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

export const SUB_PATH_ACTIVITY = {
  UNREAD: "unread",
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
  ACTIVITY_UNREAD: "/activity/unread",

  FOLLOWING: "/following",
  MESSAGE: "/message",
  POST_DETAIL: (id = ":id") => `/posts/${id}`,

  //SEARCH
  SEARCH: "/search",
  SEARCH_PEOPLE: "/search/people",
  SEARCH_POSTS: "/search/posts",
  SEARCH_HASHTAGS: "/search/hashtags",

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
  PROFILE_DRAFTS: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.DRAFTS}`,
  PROFILE_SAVED: (id = ":id") => `/profile/${id}/${SUB_PATH_PROFILE.SAVED}`,
};
export default ROUTE_PATHS;
