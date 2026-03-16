import mongoose from "mongoose";

import AuthController from "@/interfaces/controllers/auth.controller";

import {
  CompleteSignUpUsecase,
  ForgotPasswordUsecase,
  RefreshTokenUsecase,
  ResetPasswordUsecase,
  SignInUsecase,
  SignOutUsecase,
  StartSignupUseCase,
  VerifySignupUsecase,
  ChangePasswordUsecase,
} from "@/application/usecases/auth";

import {
  MongooseSessionRepository,
  MongooseUserIntentRepository,
  MongooseUserRepository,
} from "../database/repositories";
import NodeMailerService from "../services/nodemailer.service";
import RedisService from "../services/redis.service";
import { JwtService } from "../services/jwt.service";
import { TokenService } from "../services/token.service";
import { BcryptService } from "../services/bcrypt.service";
import { MongooseUnitOfWorkFactory } from "../database/mongoose.unit-of-work";

const userRepo = new MongooseUserRepository();
const sessionRepo = new MongooseSessionRepository();
const userIntentRepo = new MongooseUserIntentRepository();

const uowFactory = new MongooseUnitOfWorkFactory(mongoose.connection);

const jwtSvc = new JwtService();
const mailSvc = new NodeMailerService();
const cacheSvc = RedisService.getInstance();
const tokenSvc = new TokenService();
const passwordSvc = new BcryptService();

const startSignUpUseCase = new StartSignupUseCase(
  userRepo,
  userIntentRepo,
  mailSvc,
  cacheSvc,
  tokenSvc,
);
const verifySignupUseCase = new VerifySignupUsecase(userIntentRepo, tokenSvc, cacheSvc);
const completeSignUpUseCase = new CompleteSignUpUsecase(
  uowFactory,
  jwtSvc,
  cacheSvc,
  tokenSvc,
  passwordSvc,
);
const signInUseCase = new SignInUsecase(uowFactory, jwtSvc, tokenSvc, passwordSvc);
const refreshTokenUseCase = new RefreshTokenUsecase(
  sessionRepo,
  userRepo,
  jwtSvc,
  tokenSvc,
  cacheSvc,
);
const signOutUseCase = new SignOutUsecase(sessionRepo);
const forgotPasswordUseCase = new ForgotPasswordUsecase(userRepo, cacheSvc, tokenSvc, mailSvc);
const resetPasswordUseCase = new ResetPasswordUsecase(uowFactory, cacheSvc, tokenSvc, passwordSvc);
const changePasswordUseCase = new ChangePasswordUsecase(uowFactory, passwordSvc);

const authController = new AuthController(
  startSignUpUseCase,
  verifySignupUseCase,
  completeSignUpUseCase,
  signInUseCase,
  refreshTokenUseCase,
  signOutUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  changePasswordUseCase,
);

export default authController;
