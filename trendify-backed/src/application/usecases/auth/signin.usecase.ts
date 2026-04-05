import * as Response from "@/shared/responses";

import { SignInDTO } from "@/application/dtos/auth.dto";
import { IJwtService, IPasswordService, ITokenService, IFileStorageService } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { IMediaRepository } from "@/domain/media";
import { SessionEntity } from "@/domain/session";
import appConfig from "@/config/app.config";
import { UserSettingsEntity } from "@/domain/user-setting";
import { MediaMapper } from "@/application/mappers/media.mapper";
import { toMediaRecord } from "@/application/mappers/media.mapper";

export class SignInUsecase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly jwtSvc: IJwtService,
    private readonly tokenSvc: ITokenService,
    private readonly passwordSvc: IPasswordService,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  generateRefreshToken() {
    const token = this.tokenSvc.generateRandom(64);

    return {
      refreshTokenRaw: token,
      refreshTokenHash: this.tokenSvc.hash(token),
    };
  }

  generateAccessToken(payload: any) {
    return this.jwtSvc.sign(payload, appConfig.accessTokenSecret, {
      expiresIn: appConfig.accessTokenTtl,
    });
  }

  async execute(body: SignInDTO) {
    const uow = await this.uowFactory.create();

    try {
      const user = await uow.users.findByEmail(body.email);
      if (!user) {
        throw new Response.BadRequestError("Sorry, your email or password was incorrect.");
      }

      let settings = await uow.userSettings.findByUserId(user.id!);
      if (!settings) {
        settings = await uow.userSettings.create(UserSettingsEntity.create(user.id!));
      }

      const isMatch = this.passwordSvc.compare(body.password, user.data.password);
      if (!isMatch) {
        throw new Response.BadRequestError("Sorry, your email or password was incorrect.");
      }

      await uow.sessions.revokeByUserAndDevice(user.id!, body.deviceId);

      const { refreshTokenHash, refreshTokenRaw } = this.generateRefreshToken();

      const sessionEntity = SessionEntity.create({
        userId: user.id!,
        deviceId: body.deviceId,
        userAgent: body.userAgent,
        ipAddress: body.ipAddress,
        refreshTokenHash,
      });

      const newSession = await uow.sessions.create(sessionEntity);
      const accessToken = this.generateAccessToken({ sub: user.id });
      await uow.commit();

      // Resolve profilePicture & coverPicture from mediaId to variant URLs
      const snapshot = user.toSnapshot();
      const mediaIds = [snapshot.profilePicture, snapshot.coverPicture].filter(
        (id): id is string => typeof id === "string",
      );
      const mediaEntities = mediaIds.length > 0 ? await this.mediaRepo.findByIds(mediaIds) : [];
      const mediaRecord = toMediaRecord(mediaEntities);

      const resolvedUser = {
        ...snapshot,
        profilePicture: MediaMapper.resolveVariantMap(
          snapshot.profilePicture,
          mediaRecord,
          this.storageSvc,
        ),
        coverPicture: MediaMapper.resolveVariantMap(
          snapshot.coverPicture,
          mediaRecord,
          this.storageSvc,
        ),
      };

      return {
        publicData: {
          user: resolvedUser,
          settings: settings.toSnapshot(),
          tokens: { accessToken },
        },
        cookieData: { refreshTokenRaw, sessionId: newSession.id! },
      };
    } catch (error) {
      await uow.rollback();
      throw new Response.BadRequestError("Sorry, your email or password was incorrect.");
    }
  }
}
