import { Router } from "express";

import postController from "@/infrastructure/injection/post.injection";

import { authMiddleware } from "@/interfaces/middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "@/interfaces/middlewares/validate.middleware";

import * as schema from "@/interfaces/validators/post.validator";
import { POST_ROUTES } from "@/shared/constants/router.constant";

const route = Router();

route.use(authMiddleware());

// ====================== POST CRUD ======================

route.post(POST_ROUTES.CREATE, validate(schema.createPostSchema), postController.createPost);

// Saved posts MUST come before /:postId to avoid matching "saved" as postId
route.get(
  POST_ROUTES.GET_SAVED_POSTS,
  validateQuery(schema.paginationQuerySchema),
  postController.getSavedPosts,
);

// Draft posts MUST come before /:postId to avoid matching "drafts" as postId
route.get(
  POST_ROUTES.GET_DRAFT_POSTS,
  validateQuery(schema.userPostsQuerySchema),
  postController.getDraftPosts,
);

// Home feed — MUST come before /:postId
route.get(
  POST_ROUTES.HOME_FEED,
  validateQuery(schema.paginationQuerySchema),
  postController.getFollowingFeed,
);

route.get(
  POST_ROUTES.GET_FOLLOWING_POSTS,
  validateQuery(schema.paginationQuerySchema),
  postController.getFollowingFeed,
);

// Hashtag posts — MUST come before /:postId
route.get(
  POST_ROUTES.GET_POSTS_BY_HASHTAG,
  validateParams(schema.hashtagTagParamSchema),
  validateQuery(schema.paginationQuerySchema),
  postController.getPostsByHashtag,
);

route.get(POST_ROUTES.GET_POST, validateParams(schema.postIdParamSchema), postController.getPost);

route.delete(
  POST_ROUTES.DELETE_POST,
  validateParams(schema.postIdParamSchema),
  postController.deletePost,
);

route.patch(
  POST_ROUTES.UPDATE_POST,
  validateParams(schema.postIdParamSchema),
  validate(schema.updatePostSchema),
  postController.updatePost,
);

// ====================== LIKES ======================

route.post(
  POST_ROUTES.LIKE_POST,
  validateParams(schema.postIdParamSchema),
  postController.likePost,
);

route.delete(
  POST_ROUTES.UNLIKE_POST,
  validateParams(schema.postIdParamSchema),
  postController.unlikePost,
);

route.get(
  POST_ROUTES.GET_LIKES_POST,
  validateParams(schema.postIdParamSchema),
  validateQuery(schema.paginationQuerySchema),
  postController.getPostLikes,
);

// ====================== COMMENTS ======================

route.post(
  POST_ROUTES.COMMENT_POST,
  validateParams(schema.postIdParamSchema),
  validate(schema.createCommentSchema),
  postController.createComment,
);

route.get(
  POST_ROUTES.GET_COMMENT_POST,
  validateParams(schema.postIdParamSchema),
  validateQuery(schema.paginationQuerySchema),
  postController.getComments,
);

route.get(
  POST_ROUTES.GET_COMMENT_REPLIES,
  validateParams(schema.commentIdParamSchema),
  validateQuery(schema.paginationQuerySchema),
  postController.getCommentReplies,
);

route.post(
  POST_ROUTES.LIKE_COMMENT,
  validateParams(schema.commentIdParamSchema),
  postController.likeComment,
);

route.delete(
  POST_ROUTES.UNLIKE_COMMENT,
  validateParams(schema.commentIdParamSchema),
  postController.unlikeComment,
);

route.delete(
  POST_ROUTES.DELETE_COMMENT,
  validateParams(schema.commentIdParamSchema),
  postController.deleteComment,
);

// ====================== SAVES ======================

route.post(
  POST_ROUTES.SAVE_POST,
  validateParams(schema.postIdParamSchema),
  postController.savePost,
);

route.delete(
  POST_ROUTES.UNSAVE_POST,
  validateParams(schema.postIdParamSchema),
  postController.unsavePost,
);

export default route;
