import mongoose from "mongoose";

import { MongooseUnitOfWorkFactory } from "../database/mongoose.unit-of-work";
import RedisService from "../services/redis.service";
import { Producer } from "../messaging/producer";

import { BlockUserUsecase } from "@/application/usecases/block/block-user.usecase";
import { UnblockUserUsecase } from "@/application/usecases/block/unblock-user.usecase";
import { GetBlockedListUsecase } from "@/application/usecases/block/get-blocked-list.usecase";
import BlockController from "@/interfaces/controllers/block.controller";
import { MongooseBlockRepository, MongooseUserRepository } from "../database/repositories";

const uowFactory = new MongooseUnitOfWorkFactory(mongoose.connection);
const cacheSvc = RedisService.getInstance();
const producer = new Producer();

const blockRepo = new MongooseBlockRepository();
const userRepo = new MongooseUserRepository();

export const blockUserUsecase = new BlockUserUsecase(uowFactory, cacheSvc, producer);
export const unblockUserUsecase = new UnblockUserUsecase(uowFactory, cacheSvc);
export const getBlockedListUsecase = new GetBlockedListUsecase(blockRepo, userRepo);

const blockController = new BlockController(
  blockUserUsecase,
  unblockUserUsecase,
  getBlockedListUsecase,
);

export default blockController;
