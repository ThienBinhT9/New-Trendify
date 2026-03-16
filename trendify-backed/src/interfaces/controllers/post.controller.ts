import { Request, Response } from "express";

import {
  CreatePostUseCase,
  GetPostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  GetUserPostsUseCase,
  GetFollowingFeedUseCase,
  LikePostUseCase,
  UnlikePostUseCase,
  GetPostLikesUseCase,
  CreateCommentUseCase,
  GetCommentsUseCase,
  GetCommentRepliesUseCase,
  DeleteCommentUseCase,
  SavePostUseCase,
  UnsavePostUseCase,
  GetSavedPostsUseCase,
} from "@/application/usecases/post";

class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly getUserPostsUseCase: GetUserPostsUseCase,
    private readonly getFollowingFeedUseCase: GetFollowingFeedUseCase,
    private readonly likePostUseCase: LikePostUseCase,
    private readonly unlikePostUseCase: UnlikePostUseCase,
    private readonly getPostLikesUseCase: GetPostLikesUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getCommentRepliesUseCase: GetCommentRepliesUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly savePostUseCase: SavePostUseCase,
    private readonly unsavePostUseCase: UnsavePostUseCase,
    private readonly getSavedPostsUseCase: GetSavedPostsUseCase,
  ) {}

  // ====================== POST CRUD ======================

  createPost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.createPostUseCase.execute({
      authorId: userId,
      ...request.body,
    });

    return response.status(201).json(result);
  };

  getPost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.getPostUseCase.execute({
      viewerId: userId,
      postId,
    });

    return response.status(200).json(result);
  };

  updatePost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.updatePostUseCase.execute({
      authorId: userId,
      postId,
      ...request.body,
    });

    return response.status(200).json(result);
  };

  deletePost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.deletePostUseCase.execute({
      authorId: userId,
      postId,
    });

    return response.status(200).json(result);
  };

  getUserPosts = async (request: Request, response: Response) => {
    const viewerId = response.locals?.auth?.userId;
    const { userId } = request.params;

    const result = await this.getUserPostsUseCase.execute({
      viewerId,
      authorId: userId,
      ...request.query,
    });

    return response.status(200).json(result);
  };

  getFollowingFeed = async (request: Request, response: Response) => {
    const viewerId = response.locals?.auth?.userId;

    const result = await this.getFollowingFeedUseCase.execute({
      viewerId,
      ...request.query,
    });

    return response.status(200).json(result);
  };

  // ====================== LIKES ======================

  likePost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.likePostUseCase.execute({ userId, postId });

    return response.status(200).json(result);
  };

  unlikePost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.unlikePostUseCase.execute({ userId, postId });

    return response.status(200).json(result);
  };

  getPostLikes = async (request: Request, response: Response) => {
    const { postId } = request.params;

    const result = await this.getPostLikesUseCase.execute({
      postId,
      ...request.query,
    });

    return response.status(200).json(result);
  };

  // ====================== COMMENTS ======================

  createComment = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.createCommentUseCase.execute({
      userId,
      postId,
      ...request.body,
    });

    return response.status(201).json(result);
  };

  getComments = async (request: Request, response: Response) => {
    const { postId } = request.params;

    const result = await this.getCommentsUseCase.execute({
      postId,
      ...request.query,
    });

    return response.status(200).json(result);
  };

  getCommentReplies = async (request: Request, response: Response) => {
    const { postId, commentId } = request.params;

    const result = await this.getCommentRepliesUseCase.execute({
      postId,
      commentId,
      ...request.query,
    });

    return response.status(200).json(result);
  };

  deleteComment = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId, commentId } = request.params;

    const result = await this.deleteCommentUseCase.execute({
      userId,
      postId,
      commentId,
    });

    return response.status(200).json(result);
  };

  // ====================== SAVES ======================

  savePost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.savePostUseCase.execute({ userId, postId });

    return response.status(200).json(result);
  };

  unsavePost = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { postId } = request.params;

    const result = await this.unsavePostUseCase.execute({ userId, postId });

    return response.status(200).json(result);
  };

  getSavedPosts = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.getSavedPostsUseCase.execute({
      userId,
      ...request.query,
    });

    return response.status(200).json(result);
  };
}

export default PostController;
