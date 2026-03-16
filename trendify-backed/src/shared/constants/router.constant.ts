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
  PROFILE: "/:id",
  SETTINGS: "/me/settings",
  FOLLOWERS: "/:userId/followers",
  FOLLOWING: "/:userId/following",
  POSTS: "/:userId/posts",
  BLOCKED: "/me/blocked",
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
  LIKE_POST: "/:postId/likes",
  UNLIKE_POST: "/:postId/likes",
  GET_LIKES_POST: "/:postId/likes",
  COMMENT_POST: "/:postId/comments",
  GET_COMMENT_POST: "/:postId/comments",
  SHARE_POST: "/:postId/shares",
  SAVE_POST: "/:postId/saves",
  UNSAVE_POST: "/:postId/saves",
  GET_SAVED_POSTS: "/saved",
  GET_COMMENT_REPLIES: "/:postId/comments/:commentId/replies",
  DELETE_COMMENT: "/:postId/comments/:commentId",
} as const;

export const MEDIA_ROUTES = {
  BASE: `${API_PREFIX}/media`,
  PRESIGNED_URL: "/presigned",
  CONFIRM_UPLOAD: "/confirm",
  STATUS: "/:mediaId/status",
} as const;
