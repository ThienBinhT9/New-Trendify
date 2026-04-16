import { Request, Response } from "express";

import {
  BlockUserUsecase,
  GetBlockedListUsecase,
  UnblockUserUsecase,
} from "@/application/usecases/block";
import { CheckBlockStatusUsecase } from "@/application/usecases/block/check-block-status.usecase";

class BlockController {
  constructor(
    private readonly blockUseCase: BlockUserUsecase,
    private readonly unblockUseCase: UnblockUserUsecase,
    private readonly getBlockedListUsecase: GetBlockedListUsecase,
    private readonly checkBlockStatusUsecase: CheckBlockStatusUsecase,
  ) {}

  block = async (request: Request, response: Response) => {
    const blockerId = response.locals?.auth?.userId;
    const blockedId = request.params?.userId;

    const result = await this.blockUseCase.execute({ blockerId, blockedId });

    return response.status(200).json(result);
  };

  unblock = async (request: Request, response: Response) => {
    const blockerId = response.locals?.auth?.userId;
    const blockedId = request.params?.userId;

    const result = await this.unblockUseCase.execute({ blockerId, blockedId });

    return response.status(200).json(result);
  };

  getBlockedList = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.getBlockedListUsecase.execute({ userId });

    return response.status(200).json(result);
  };

  checkBlockStatus = async (request: Request, response: Response) => {
    const viewerId = response.locals?.auth?.userId;
    const targetId = request.params?.userId;

    const result = await this.checkBlockStatusUsecase.execute({ viewerId, targetId });

    return response.status(200).json(result);
  };
}

export default BlockController;

