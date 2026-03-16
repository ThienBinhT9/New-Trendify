import mongoose from "mongoose";

import FollowController from "@/interfaces/controllers/follow.controller";

import {
  MongooseFollowRepository,
  MongooseMediaRepository,
  MongooseUserRepository,
} from "../database/repositories";
import RedisService from "../services/redis.service";
import { MongooseUnitOfWorkFactory } from "../database/mongoose.unit-of-work";
import { FollowUserUseCase } from "@/application/usecases/follow/follow-user.usecase";
import {
  AcceptFollowRequestUseCase,
  CancelFollowRequestUseCase,
  RejectFollowRequestUseCase,
  UnfollowUserUseCase,
  GetFollowersUseCase,
  GetFollowingUseCase,
  RemovefollowUserUseCase,
} from "@/application/usecases/follow";
import { Producer } from "../messaging/producer";
import S3Service from "../services/s3.service";

const userRepo = new MongooseUserRepository();
const followRepo = new MongooseFollowRepository();
const mediaRepo = new MongooseMediaRepository();

const uowFactory = new MongooseUnitOfWorkFactory(mongoose.connection);
const cacheSvc = RedisService.getInstance();
const producer = new Producer();
const storageSvc = new S3Service();

const followUsecase = new FollowUserUseCase(uowFactory, cacheSvc, producer);

const unfollowUsecase = new UnfollowUserUseCase(uowFactory, cacheSvc, producer);

const removefollowUsecase = new RemovefollowUserUseCase(uowFactory, cacheSvc, producer);

const cancelFollowRequestUseCase = new CancelFollowRequestUseCase(followRepo);

const acceptFollowRequestUseCase = new AcceptFollowRequestUseCase(uowFactory, cacheSvc, producer);

const rejectFollowRequestUseCase = new RejectFollowRequestUseCase(followRepo);

const getFollowersUsecase = new GetFollowersUseCase(userRepo, followRepo, mediaRepo, storageSvc, cacheSvc);

const getFollowingUsecase = new GetFollowingUseCase(userRepo, followRepo, mediaRepo, storageSvc, cacheSvc);

const followController = new FollowController(
  followUsecase,
  unfollowUsecase,
  removefollowUsecase,
  cancelFollowRequestUseCase,
  acceptFollowRequestUseCase,
  rejectFollowRequestUseCase,
  getFollowersUsecase,
  getFollowingUsecase,
);

export default followController;
