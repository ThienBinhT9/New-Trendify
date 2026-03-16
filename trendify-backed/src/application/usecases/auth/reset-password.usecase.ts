import * as Response from "@/shared/responses";

import { ResetPasswordDTO } from "@/application/dtos/auth.dto";
import { ICacheService, IPasswordService, ITokenService } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

interface ResetTokenPayload {
  userId: string;
  passwordVersion: number;
}

export class ResetPasswordUsecase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheSvc: ICacheService,
    private readonly tokenSvc: ITokenService,
    private readonly passwordSvc: IPasswordService,
  ) {}

  // ====================== RATE LIMITING ======================

  private async checkRateLimit(tokenHash: string) {
    const { rlKey, rlTtl, limit } = CacheContextBuilder.resetPassword(tokenHash);

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

  // ====================== TOKEN VALIDATION ======================

  private async getAndValidateToken(tokenHash: string) {
    const { tokenKey } = CacheContextBuilder.resetPassword(tokenHash);
    const payload = await this.cacheSvc.get<ResetTokenPayload>(tokenKey);

    if (!payload) {
      throw new Response.BadRequestError("Invalid or expired reset token");
    }

    return payload;
  }

  private async invalidateToken(tokenHash: string) {
    const { tokenKey, rlKey } = CacheContextBuilder.resetPassword(tokenHash);
    await Promise.all([this.cacheSvc.del(tokenKey), this.cacheSvc.del(rlKey)]);
  }

  // ====================== MAIN EXECUTION ======================

  async execute(body: ResetPasswordDTO) {
    const { token, newPassword } = body;
    const tokenHash = this.tokenSvc.hash(token);

    // Step 1: Rate limiting (fail fast)
    await this.checkRateLimit(tokenHash);

    // Step 2: Get and validate token payload
    const payload = await this.getAndValidateToken(tokenHash);

    // Step 3: Invalidate token immediately to prevent reuse
    await this.invalidateToken(tokenHash);

    // Step 4: Execute password reset in transaction
    const uow = await this.uowFactory.create();

    try {
      const user = await uow.users.findById(payload.userId);
      if (!user) {
        throw new Response.BadRequestError("Invalid reset token");
      }

      if (payload.passwordVersion !== user.data.passwordVersion) {
        throw new Response.BadRequestError(
          "This reset link has expired. Please request a new one.",
        );
      }

      // Hash and update password
      const passwordHash = this.passwordSvc.hash(newPassword);
      user.updatePassword(passwordHash);
      await uow.users.update(user);

      await uow.commit();
    } catch (error) {
      await uow.rollback();

      if (error instanceof Response.BadRequestError) {
        throw error;
      }

      throw new Response.InternalServerError("Failed to reset password. Please try again.");
    }

    return new Response.SuccessResponse({
      message: "Your password has been reset successfully. Please login with your new password.",
    });
  }
}
