import * as Response from "@/shared/responses";

import { SignOutDTO } from "@/application/dtos/auth.dto";
import { ISessionRepository } from "@/domain/session";

export class SignOutUsecase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(body: SignOutDTO): Promise<Response.SuccessResponse> {
    const { sessionId, userId, logoutAll = false } = body;

    const session = await this.sessionRepo.findById(sessionId);

    if (!session) {
      return new Response.SuccessResponse({ message: "Logged out successfully" });
    }

    if (session.data.userId !== userId) {
      console.warn(
        `Security: User ${userId} attempted to logout session ${sessionId} belonging to ${session.data.userId}`,
      );
      return new Response.SuccessResponse({ message: "Logged out successfully" });
    }

    if (logoutAll) {
      await this.sessionRepo.revokeAll(userId);

      return new Response.SuccessResponse({
        message: "Logged out from all devices successfully",
      });
    }

    // Logout from current device only
    await this.sessionRepo.revokeById(sessionId);

    return new Response.SuccessResponse({ message: "Logged out successfully" });
  }
}
