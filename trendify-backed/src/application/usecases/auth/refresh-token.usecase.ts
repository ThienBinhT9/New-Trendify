import * as Response from "@/shared/responses";

import { RefreshDTO } from "@/application/dtos/auth.dto";
import { IJwtService, ITokenService, ICacheService } from "@/application/services";
import { ISessionRepository } from "@/domain/session";
import { IUserRepository } from "@/domain/user";
import appConfig from "@/config/app.config";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class RefreshTokenUsecase {
  constructor(
    private readonly sessionRepo: ISessionRepository,
    private readonly userRepo: IUserRepository,
    private readonly jwtSvc: IJwtService,
    private readonly tokenSvc: ITokenService,
    private readonly cacheSvc: ICacheService,
  ) {}

  private generateRefreshToken(): { refreshTokenRaw: string; refreshTokenHash: string } {
    const token = this.tokenSvc.generateRandom(64);
    return {
      refreshTokenRaw: token,
      refreshTokenHash: this.tokenSvc.hash(token),
    };
  }

  private generateAccessToken(userId: string): string {
    return this.jwtSvc.sign({ sub: userId }, appConfig.accessTokenSecret, {
      expiresIn: appConfig.accessTokenTtl,
    });
  }

  private async checkRateLimit(sessionId: string) {
    const { rlKey, limit, rlTtl } = CacheContextBuilder.refreshToken(sessionId);
    const attempts = await this.cacheSvc.incr(rlKey);

    if (attempts === 1) {
      await this.cacheSvc.expire(rlKey, rlTtl);
    }

    if (attempts > limit) {
      throw new Response.TooManyRequestsError("Too many refresh attempts. Please try again later.");
    }
  }

  async execute(body: RefreshDTO) {
    const { sessionId, refreshToken } = body;

    // Step 1: Rate limiting
    await this.checkRateLimit(sessionId);

    // Step 2: Find and validate session
    const session = await this.sessionRepo.findById(sessionId);

    if (!session) {
      throw new Response.UnauthorizedError("Session not found or expired");
    }
    if (session.isRevoked()) {
      throw new Response.UnauthorizedError("Session has been revoked");
    }
    if (session.isExpired()) {
      throw new Response.UnauthorizedError("Session has expired. Please login again.");
    }

    // Step 3: Verify refresh token (timing-safe)
    const providedTokenHash = this.tokenSvc.hash(refreshToken);
    if (!this.tokenSvc.compareHashes(providedTokenHash, session.data.refreshTokenHash)) {
      throw new Response.UnauthorizedError("Invalid refresh token");
    }

    // Step 4: Verify user still exists and is active
    const user = await this.userRepo.findById(session.data.userId);
    if (!user) {
      await this.sessionRepo.revokeById(sessionId);
      throw new Response.UnauthorizedError("User account is no longer active");
    }

    // Step 6: Rotate refresh token
    const { refreshTokenRaw, refreshTokenHash } = this.generateRefreshToken();

    session.rotate(refreshTokenHash);
    await this.sessionRepo.update(session);

    // Step 7: Generate new access token
    const accessToken = this.generateAccessToken(session.data.userId);

    return {
      publicData: { accessToken },
      cookieData: { refreshTokenRaw },
    };
  }
}
