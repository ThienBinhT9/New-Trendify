import * as Response from "@/shared/responses";
import appConfig from "@/config/app.config";

import { CompleteSignUpDTO } from "@/application/dtos/auth.dto";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";
import {
  IJwtService,
  ICacheService,
  IPasswordService,
  ITokenService,
} from "@/application/services";

import { UserEntity } from "@/domain/user";
import { SessionEntity } from "@/domain/session";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { JwtPayloadBase } from "@/application/services/jwt.service";
import { UserSettingsEntity } from "@/domain/user-setting";

export class CompleteSignUpUsecase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly jwtSvc: IJwtService,
    private readonly cacheSvc: ICacheService,
    private readonly tokenSvc: ITokenService,
    private readonly passwordSvc: IPasswordService,
  ) {}

  private generateRefreshToken(): { refreshTokenRaw: string; refreshTokenHash: string } {
    const token = this.tokenSvc.generateRandom(64);
    return {
      refreshTokenRaw: token,
      refreshTokenHash: this.tokenSvc.hash(token),
    };
  }

  private generateAccessToken(payload: JwtPayloadBase): string {
    return this.jwtSvc.sign(payload, appConfig.accessTokenSecret, {
      expiresIn: appConfig.accessTokenTtl,
    });
  }

  private async validateSignupSession(signupSession: string) {
    const { sessionKey } = CacheContextBuilder.signUp();
    const signupSessionData = await this.cacheSvc.get(sessionKey(signupSession));

    if (!signupSessionData) {
      throw new Response.BadRequestError("Invalid or expired signup session");
    }

    return signupSessionData;
  }

  async execute(body: CompleteSignUpDTO) {
    const { signupSession, ...userData } = body;

    // Step 1: Validate session
    const signupSessionData = await this.validateSignupSession(signupSession);

    const uow = await this.uowFactory.create();
    try {
      // Step 2: Validate intent
      const intent = await uow.userIntent.findById(signupSessionData);
      if (!intent) {
        throw new Response.BadRequestError("Signup session not found");
      }

      if (intent.isExpired()) {
        throw new Response.BadRequestError(
          "Signup session has expired. Please request a new verification link.",
        );
      }

      if (!intent.isVerified()) {
        throw new Response.BadRequestError("Signup session not verified or already consumed");
      }

      // Step 3: Check user doesn't already exist
      const existedUser = await uow.users.existsByEmail(intent.data.email);
      if (existedUser) {
        intent.consume();
        await uow.userIntent.save(intent);
        await uow.commit();

        throw new Response.ConflictError("An account with this email already exists");
      }

      // Step 4: Create user
      const passwordHashed = this.passwordSvc.hash(body.password);
      const newUser = UserEntity.create({
        ...userData,
        email: intent.data.email,
        password: passwordHashed,
      });
      const savedUser = await uow.users.create(newUser);

      const newSettings = UserSettingsEntity.create(savedUser.id!);
      await uow.userSettings.create(newSettings);

      // Step 5: Create login session
      const { refreshTokenHash, refreshTokenRaw } = this.generateRefreshToken();
      const sessionEntity = SessionEntity.create({
        userId: savedUser.id!,
        deviceId: body.deviceId,
        userAgent: body.userAgent,
        ipAddress: body.ipAddress,
        refreshTokenHash,
      });
      const savedSession = await uow.sessions.create(sessionEntity);

      // Step 6: Consume intent
      intent.consume();
      await uow.userIntent.save(intent);

      // Generate access token
      const accessToken = this.generateAccessToken({ sub: savedUser.id! });

      await uow.commit();

      await this.cacheSvc.del(CacheContextBuilder.signUp().sessionKey(signupSession));

      return {
        publicData: {
          user: savedUser.toSnapshot(),
          settings: newSettings.toSnapshot(),
          tokens: { accessToken },
        },
        cookieData: { refreshTokenRaw, sessionId: savedSession.id! },
      };
    } catch (error) {
      await uow.rollback();

      if (error instanceof Response.BadRequestError || error instanceof Response.ConflictError) {
        throw error;
      }

      throw new Response.InternalServerError("An unexpected error occurred. Please try again.");
    }
  }
}
