import * as Response from "@/shared/responses";

import { ESignupStep, SignupSettings } from "./auth.enum";

import { VerifySignUpDTO } from "@/application/dtos/auth.dto";
import { ICacheService, ITokenService } from "@/application/services";

import { IUserIntentRepository } from "@/domain/user-intent";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class VerifySignupUsecase {
  constructor(
    private readonly userIntentRepo: IUserIntentRepository,
    private readonly tokenSvc: ITokenService,
    private readonly cacheSvc: ICacheService,
  ) {}

  async execute(body: VerifySignUpDTO) {
    const tokenHash = this.tokenSvc.hash(body.token);

    // Step 1: Find intent by token hash
    const intent = await this.userIntentRepo.findByToken(tokenHash);
    if (!intent) {
      throw new Response.BadRequestError("Invalid or expired verification link");
    }

    // Step 2: Validate intent state
    if (intent.isExpired()) {
      throw new Response.BadRequestError(
        "Verification link has expired. Please request a new one.",
      );
    }

    if (intent.isVerified()) {
      // Already verified and not expired - create new session
      return await this.createSession(intent.id!);
    }

    // Must be PENDING to verify
    if (!intent.isPending()) {
      throw new Response.BadRequestError("This verification link has already been used");
    }

    // Step 3: Verify intent and extend expiration
    const newExpiresAt = new Date(Date.now() + SignupSettings.ttlVerify);
    intent.verify(newExpiresAt);
    await this.userIntentRepo.save(intent);

    // Step 4: Create session
    return await this.createSession(intent.id!);
  }

  private async createSession(intentId: string) {
    const { sessionKey, sessionTtl } = CacheContextBuilder.signUp();

    const signupSession = this.tokenSvc.generateRandom();

    await this.cacheSvc.set(sessionKey(signupSession), intentId, sessionTtl);

    return {
      publicData: { nextStep: ESignupStep.COMPLETE_SIGNUP },
      cookieData: { signupSession },
    };
  }
}
