import { Request, Response } from "express";

import { IPresenceService, EPresenceStatus } from "@/application/services/presence.service";
import { IUserSettingsRepository } from "@/domain/user-setting";
import { SuccessResponse } from "@/shared/responses";

class PresenceController {
  constructor(
    private readonly presenceService: IPresenceService,
    private readonly settingsRepo: IUserSettingsRepository,
  ) {}

  /**
   * GET /api/users/:userId/presence
   *
   * Lấy trạng thái presence cho 1 user.
   * Kiểm tra privacy: nếu target user tắt showOnlineStatus → trả "hidden".
   */
  getUserPresence = async (request: Request, response: Response) => {
    const targetId = request.params.userId;

    // Privacy check
    const settings = await this.settingsRepo.findByUserId(targetId);
    if (settings && !settings.shouldShowOnlineStatus()) {
      const successResponse = new SuccessResponse({
        data: { status: "hidden" },
      });
      return response.status(200).json(successResponse);
    }

    const presence = await this.presenceService.getStatus(targetId);

    const successResponse = new SuccessResponse({
      data: {
        status: presence.status,
        lastSeen: presence.lastSeen?.toISOString() ?? null,
        idleSince: presence.idleSince?.toISOString() ?? null,
      },
    });
    response.status(200).json(successResponse);
  };

  /**
   * POST /api/users/presence/batch
   *
   * Batch query trạng thái presence cho nhiều users.
   * Body: { userIds: string[] } — max 50
   *
   * Response: { [userId]: { status, lastSeen } }
   * Users có privacy tắt → không trả về trong kết quả.
   */
  getBatchPresence = async (request: Request, response: Response) => {
    const { userIds } = request.body as { userIds: string[] };

    // Limit batch size
    const limitedIds = userIds.slice(0, 50);

    // 1. Get presence statuses
    const statuses = await this.presenceService.getStatusBatch(limitedIds);

    // 2. Build result — skip privacy check for batch (performance)
    //    Privacy is enforced on initial subscription (socket broadcast).
    //    REST batch is for initial data hydration of already-visible users.
    const result: Record<
      string,
      { status: EPresenceStatus; lastSeen: string | null }
    > = {};

    statuses.forEach((presence, userId) => {
      result[userId] = {
        status: presence.status,
        lastSeen: presence.lastSeen?.toISOString() ?? null,
      };
    });

    const successResponse = new SuccessResponse({ data: result });
    response.status(200).json(successResponse);
  };
}

export default PresenceController;
