import mongoose from "mongoose";

import PostController from "@/interfaces/controllers/post.controller";

import {
  MongoosePostRepository,
  MongooseLikeRepository,
  MongooseSaveRepository,
  MongooseCommentRepository,
  MongooseUserRepository,
  MongooseFollowRepository,
  MongooseBlockRepository,
} from "@/infrastructure/database/repositories";
import { MongooseMediaRepository } from "@/infrastructure/database/repositories/media.repository.impl";
import { MongooseUnitOfWorkFactory } from "@/infrastructure/database/mongoose.unit-of-work";
import RedisService from "@/infrastructure/services/redis.service";
import { Producer } from "@/infrastructure/messaging/producer";
import S3Service from "@/infrastructure/services/s3.service";

import {
  CreatePostUseCase,
  GetPostUseCase,
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
  GetDraftPostsUseCase,
} from "@/application/usecases/post";

// Infrastructure
const postRepo = new MongoosePostRepository();
const likeRepo = new MongooseLikeRepository();
const saveRepo = new MongooseSaveRepository();
const commentRepo = new MongooseCommentRepository();
const userRepo = new MongooseUserRepository();
const followRepo = new MongooseFollowRepository();
const blockRepo = new MongooseBlockRepository();
const mediaRepo = new MongooseMediaRepository();
const storageSvc = new S3Service();

const uowFactory = new MongooseUnitOfWorkFactory(mongoose.connection);
const cacheSvc = RedisService.getInstance();
const producer = new Producer();

// Post CRUD Use Cases
const createPostUseCase = new CreatePostUseCase(uowFactory, mediaRepo, storageSvc);

const getPostUseCase = new GetPostUseCase(
  postRepo,
  userRepo,
  likeRepo,
  saveRepo,
  followRepo,
  blockRepo,
  cacheSvc,
  mediaRepo,
  storageSvc,
);

const deletePostUseCase = new DeletePostUseCase(
  uowFactory,
  likeRepo,
  saveRepo,
  commentRepo,
  mediaRepo,
  storageSvc,
  cacheSvc,
);

const getUserPostsUseCase = new GetUserPostsUseCase(
  postRepo,
  userRepo,
  likeRepo,
  saveRepo,
  followRepo,
  blockRepo,
  cacheSvc,
  mediaRepo,
  storageSvc,
);

const getFollowingFeedUseCase = new GetFollowingFeedUseCase(
  postRepo,
  followRepo,
  blockRepo,
  likeRepo,
  saveRepo,
  mediaRepo,
  userRepo,
  storageSvc,
);

// Like Use Cases
const likePostUseCase = new LikePostUseCase(postRepo, likeRepo, blockRepo, producer);
const unlikePostUseCase = new UnlikePostUseCase(postRepo, likeRepo, producer);
const getPostLikesUseCase = new GetPostLikesUseCase(postRepo, likeRepo, userRepo);

// Comment Use Cases
const createCommentUseCase = new CreateCommentUseCase(postRepo, commentRepo, blockRepo, producer);
const getCommentsUseCase = new GetCommentsUseCase(postRepo, commentRepo, userRepo);
const getCommentRepliesUseCase = new GetCommentRepliesUseCase(commentRepo, userRepo);
const deleteCommentUseCase = new DeleteCommentUseCase(postRepo, commentRepo, producer);

// Save Use Cases
const savePostUseCase = new SavePostUseCase(postRepo, saveRepo, blockRepo, producer);
const unsavePostUseCase = new UnsavePostUseCase(postRepo, saveRepo, producer);
const getSavedPostsUseCase = new GetSavedPostsUseCase(
  postRepo,
  saveRepo,
  likeRepo,
  userRepo,
  followRepo,
  blockRepo,
  mediaRepo,
  storageSvc,
);

const getDraftPostsUseCase = new GetDraftPostsUseCase(
  postRepo,
  userRepo,
  likeRepo,
  saveRepo,
  mediaRepo,
  storageSvc,
);

// Controller
const postController = new PostController(
  createPostUseCase,
  getPostUseCase,
  deletePostUseCase,
  getUserPostsUseCase,
  getFollowingFeedUseCase,
  likePostUseCase,
  unlikePostUseCase,
  getPostLikesUseCase,
  createCommentUseCase,
  getCommentsUseCase,
  getCommentRepliesUseCase,
  deleteCommentUseCase,
  savePostUseCase,
  unsavePostUseCase,
  getSavedPostsUseCase,
  getDraftPostsUseCase,
);

export default postController;
