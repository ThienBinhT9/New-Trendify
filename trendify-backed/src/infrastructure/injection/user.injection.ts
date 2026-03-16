import UserController from "@/interfaces/controllers/user.controller";

import RedisService from "../services/redis.service";
import S3Service from "../services/s3.service";

import {
  MongooseFollowRepository,
  MongooseUserRepository,
  MongooseSettingsRepository,
  MongooseBlockRepository,
  MongooseMediaRepository,
} from "@/infrastructure/database/repositories";
import {
  UpdateSettingsUseCase,
  UpdateProfileUseCase,
  UserProfileUseCase,
  GetSettingsUseCase,
} from "@/application/usecases/user";

const userRepo = new MongooseUserRepository();
const settingRepo = new MongooseSettingsRepository();
const followRepo = new MongooseFollowRepository();
const blockRepo = new MongooseBlockRepository();
const mediaRepo = new MongooseMediaRepository();

const cacheSvc = RedisService.getInstance();
const storageSvc = new S3Service();

// Use Cases
const userProfileUsecase = new UserProfileUseCase(userRepo, mediaRepo, followRepo, blockRepo, cacheSvc, storageSvc);
const updateProfileUsecase = new UpdateProfileUseCase(userRepo, mediaRepo, cacheSvc, storageSvc);
const updateSettingsUseCase = new UpdateSettingsUseCase(settingRepo, cacheSvc);
const getSettingsUseCase = new GetSettingsUseCase(settingRepo, cacheSvc);

const userController = new UserController(
  userProfileUsecase,
  updateProfileUsecase,
  updateSettingsUseCase,
  getSettingsUseCase,
);

export default userController;
