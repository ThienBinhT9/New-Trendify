export const API_PREFIX = "/api";

export const AUTH_ROUTES = {
  BASE: `${API_PREFIX}/auth`,
  SIGNUP: "/sign-up",
  SIGNUP_VERIFY: "/sign-up/verify",
  SIGNUP_COMPLETE: "/sign-up/complete",
  SIGNIN: "/sign-in",
  SIGNOUT: "/sign-out",
  REFRESH: "/refresh",
  FORGOT_PASSWORD: "/password/forgot",
  RESET_PASSWORD: "/password/reset",
  CHANGE_PASSWORD: "/password/change",
} as const;

export const USER_ROUTES = {
  BASE: `${API_PREFIX}/users`,
  ME: "/me",
  NOTIFICATIONS: "/me/notifications",
  NOTIFICATIONS_UNREAD_COUNT: "/me/notifications/unread-count",
  NOTIFICATION_READ: "/me/notifications/:notificationId/read",
  NOTIFICATIONS_READ_ALL: "/me/notifications/read-all",
  PROFILE: "/:id",
  SETTINGS: "/me/settings",
  FOLLOWERS: "/:userId/followers",
  FOLLOWING: "/:userId/following",
  POSTS: "/:userId/posts",
  BLOCKED: "/me/blocked",
  PRESENCE: "/:userId/presence",
  PRESENCE_BATCH: "/presence/batch",
} as const;

export const FOLLOW_ROUTES = {
  BASE: `${API_PREFIX}/follow`,
  FOLLOW_USER: "/:userId",
  UNFOLLOW_USER: "/:userId",
  REMOVE_FOLLOW_USER: "/followers/:userId",
  CANCEL_REQUEST: "/follow-requests/:userId",
  ACCEPT_REQUEST: "/follow-requests/:requesterId/accept",
  REJECT_REQUEST: "/follow-requests/:requesterId/reject",
} as const;

export const POST_ROUTES = {
  BASE: `${API_PREFIX}/posts`,
  CREATE: "/",
  GET_POST: "/:postId",
  UPDATE_POST: "/:postId",
  DELETE_POST: "/:postId",
  HOME_FEED: "/feed",
  LIKE_POST: "/:postId/like",
  UNLIKE_POST: "/:postId/like",
  GET_LIKES_POST: "/:postId/likes",
  COMMENT_POST: "/:postId/comments",
  GET_COMMENT_POST: "/:postId/comments",
  SHARE_POST: "/:postId/shares",
  SAVE_POST: "/:postId/save",
  UNSAVE_POST: "/:postId/save",
  GET_SAVED_POSTS: "/saved",
  GET_DRAFT_POSTS: "/drafts",
  GET_COMMENT_REPLIES: "/:postId/comments/:commentId/replies",
  DELETE_COMMENT: "/:postId/comments/:commentId",
  LIKE_COMMENT: "/:postId/comments/:commentId/like",
  UNLIKE_COMMENT: "/:postId/comments/:commentId/like",
  GET_FOLLOWING_POSTS: "/following",
  GET_POSTS_BY_HASHTAG: "/hashtag/:tag",
} as const;

export const MEDIA_ROUTES = {
  BASE: `${API_PREFIX}/media`,
  PRESIGNED_URL: "/presigned",
  CONFIRM_UPLOAD: "/confirm",
  STATUS: "/:mediaId/status",
} as const;

export const CHAT_ROUTES = {
  BASE: `${API_PREFIX}/chat`,
} as const;

export const SEARCH_ROUTES = {
  BASE: `${API_PREFIX}/search`,
  FEDERATED: "/",
  SEARCH_USERS: "/users",
  SEARCH_POSTS: "/posts",
  SEARCH_HASHTAGS: "/hashtags",
  AUTOCOMPLETE: "/autocomplete",
  TRENDING: "/trending",
  HISTORY: "/history",
  DELETE_HISTORY_ENTRY: "/history/:id",
  DELETE_ALL_HISTORY: "/history",
  SAVE_RECENTLY_VIEWED: "/recently-viewed",
  GET_RECENTLY_VIEWED: "/recently-viewed",
} as const;

export const AI_ROUTES = {
  BASE: `${API_PREFIX}/ai`,
} as const;

