import * as Response from "@/shared/responses";
import appConfig from "@/config/app.config";

import { ForgotPasswordDTO } from "@/application/dtos/auth.dto";
import { ICacheService, ITokenService, IMailService } from "@/application/services";
import { IUserRepository } from "@/domain/user";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";
import { templeteResetPassword } from "@/shared/utils";

export class ForgotPasswordUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly cacheSvc: ICacheService,
    private readonly tokenSvc: ITokenService,
    private readonly mailSvc: IMailService,
  ) {}

  // ====================== RATE LIMITING ======================
  private async checkEmailRateLimit(email: string) {
    const { rlKey, rlTtl, limit } = CacheContextBuilder.forgotPassword(email);
    const attempts = await this.cacheSvc.incr(rlKey);
    if (attempts === 1) {
      await this.cacheSvc.expire(rlKey, rlTtl);
    }
    if (attempts > limit) {
      throw new Response.TooManyRequestsError(
        "Too many password reset attempts. Please try again later.",
      );
    }
  }

  private generateToken() {
    const token = this.tokenSvc.generateRandom(64);
    return {
      tokenRaw: token,
      tokenHash: this.tokenSvc.hash(token),
    };
  }

  private async storeResetToken(tokenHash: string, userId: string, passwordVersion: number) {
    const { tokenKey, tokenTtl } = CacheContextBuilder.resetPassword(tokenHash);

    await this.cacheSvc.set(
      tokenKey,
      {
        userId,
        passwordVersion,
      },
      tokenTtl,
    );
  }

  private async sendResetEmail(email: string, token: string) {
    const resetUrl = `${appConfig.frontendUrl}/reset-password?token=${token}`;

    const html = templeteResetPassword
      .replace(/{{RESET_URL}}/g, resetUrl)
      .replace("{{YEAR}}", String(new Date().getFullYear()));

    await this.mailSvc.send(email, "Password Reset Request", html);
  }

  async execute(body: ForgotPasswordDTO) {
    const { email } = body;

    // Step 1: Rate limiting (fail fast)
    await this.checkEmailRateLimit(email);

    // Step 2: Find user (don't reveal if exists)
    const user = await this.userRepo.findByEmail(email);

    // Step 3: If user exists, generate and store token, send email
    if (user && user.id) {
      const { tokenRaw, tokenHash } = this.generateToken();

      await this.storeResetToken(tokenHash, user.id, user.data.passwordVersion);
      await this.sendResetEmail(email, tokenRaw);
    }

    // Step 4: Always return same response (prevents email enumeration)
    return new Response.SuccessResponse({
      message: "If the email exists, a reset link has been sent.",
    });
  }
}
