import { Request, Response } from "express";

import {
  UserProfileUseCase,
  UpdateProfileUseCase,
  UpdateSettingsUseCase,
  GetSettingsUseCase,
} from "@/application/usecases/user";
import { SuccessResponse } from "@/shared/responses";

class UserController {
  constructor(
    private readonly userProfileUseCase: UserProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
    private readonly getSettingsUseCase: GetSettingsUseCase,
  ) {}

  userProfile = async (request: Request, response: Response) => {
    const userId = request.params.id;
    const viewerId = response.locals?.auth?.userId;

    const result = await this.userProfileUseCase.execute({ userId, viewerId });

    const successResponse = new SuccessResponse({ data: result });
    response.status(200).json(successResponse);
  };

  updateProfile = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.updateProfileUseCase.execute({ ...request.body, userId });

    const successResponse = new SuccessResponse({ data: result });
    response.status(200).json(successResponse);
  };

  updateSettings = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.updateSettingsUseCase.execute({ ...request.body, userId });

    const successResponse = new SuccessResponse({ data: result });
    response.status(200).json(successResponse);
  };

  getSettings = async (_request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.getSettingsUseCase.execute({ userId });

    const successResponse = new SuccessResponse({ data: result });
    response.status(200).json(successResponse);
  };
}

export default UserController;
