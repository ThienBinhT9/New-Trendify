import * as Response from "@/shared/responses";
import appConfig from "@/config/app.config";

import { renderVerifyEmail } from "@/shared/utils";
import { SignupSettings, ESignupStep } from "./auth.enum";

import { StartSignUpDTO } from "@/application/dtos/auth.dto";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";
import { IMailService, ICacheService, ITokenService } from "@/application/services";

import { IUserRepository } from "@/domain/user";
import { IUserIntentRepository, UserIntentEntity } from "@/domain/user-intent";

export class StartSignupUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly userIntentRepo: IUserIntentRepository,
    private readonly mailSvc: IMailService,
    private readonly cacheSvc: ICacheService,
    private readonly tokenSvc: ITokenService,
  ) {}

  private async ensureNotRateLimited(email: string): Promise<void> {
    const { rlTtl, limit, rlKey } = CacheContextBuilder.signUp(email);
    const emailAttempts = await this.cacheSvc.incr(rlKey);

    if (emailAttempts === 1) {
      await this.cacheSvc.expire(rlKey, rlTtl);
    }

    if (emailAttempts > limit) {
      throw new Response.TooManyRequestsError(
        "Too many signup attempts for this email. Please try again later.",
      );
    }
  }

  private async queueVerificationEmail(email: string, token: string, intentId?: string) {
    await this.sendVerificationEmailSync(email, token);
    // try {

    // } catch (error) {
    //   await this.sendVerificationEmailSync(email, token);
    // }
  }

  private async sendVerificationEmailSync(email: string, token: string): Promise<void> {
    const verifyUrl = `${appConfig.frontendUrl}/sign-up/verify/callback?token=${token}`;

    const html = renderVerifyEmail({
      verifyUrl,
      appName: appConfig.appName,
      supportEmail: appConfig.supportEmail,
    });

    await this.mailSvc.send(email, "Verify your email", html);
  }

  private async createNewIntent(email: string): Promise<void> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + SignupSettings.ttlMagicLink);

    const newIntent = UserIntentEntity.create({
      email,
      expiresAt,
      tokenHash: token.hash,
    });

    await this.userIntentRepo.create(newIntent);
    await this.queueVerificationEmail(email, token.raw, newIntent.id);
  }

  private generateToken() {
    const token = this.tokenSvc.generateRandom();
    return {
      raw: token,
      hash: this.tokenSvc.hash(token),
    };
  }

  async execute(body: StartSignUpDTO) {
    const { email } = body;

    // Step 1: Rate limit check
    await this.ensureNotRateLimited(email);

    // Step 2: Check if user already exists
    const existedUser = await this.userRepo.existsByEmail(email);
    if (existedUser) {
      throw new Response.BadRequestError("An account with this email already exists.");
    }

    // Step 3: Check existing intent
    const intent = await this.userIntentRepo.findByEmail(email);

    if (intent && intent.isVerified()) {
      // Case: Intent exists and is VERIFIED but expired
      if (intent.isExpired()) {
        await this.createNewIntent(email);
        return { publicData: { nextStep: ESignupStep.CHECK_EMAIL } };
      }

      // Case: Intent exists and is VERIFIED (and not expired)
      return { publicData: { nextStep: ESignupStep.COMPLETE_SIGNUP } };
    }

    // Case: Intent exists and is PENDING
    if (intent && intent.isPending()) {
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + SignupSettings.ttlMagicLink);

      intent.rotateToken(token.hash, expiresAt);
      await this.userIntentRepo.save(intent);
      await this.queueVerificationEmail(email, token.raw, intent.id);

      return { publicData: { nextStep: ESignupStep.CHECK_EMAIL } };
    }

    // Case: No active intent exists
    await this.createNewIntent(email);

    return { publicData: { nextStep: ESignupStep.CHECK_EMAIL } };
  }
}
