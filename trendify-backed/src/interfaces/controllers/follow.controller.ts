import { Request, Response } from "express";

import {
  FollowUserUseCase,
  UnfollowUserUseCase,
  AcceptFollowRequestUseCase,
  CancelFollowRequestUseCase,
  RejectFollowRequestUseCase,
  GetFollowersUseCase,
  GetFollowingUseCase,
  RemovefollowUserUseCase,
} from "@/application/usecases/follow";

class FollowController {
  constructor(
    private readonly followUseCase: FollowUserUseCase,
    private readonly unfollowUseCase: UnfollowUserUseCase,
    private readonly removefollowUseCase: RemovefollowUserUseCase,
    private readonly cancelFollowRequestUseCase: CancelFollowRequestUseCase,
    private readonly acceptFollowRequestUseCase: AcceptFollowRequestUseCase,
    private readonly rejectFollowRequestUseCase: RejectFollowRequestUseCase,
    private readonly getFollowersUsecase: GetFollowersUseCase,
    private readonly getFollowingUsecase: GetFollowingUseCase,
  ) {}

  follow = async (request: Request, response: Response) => {
    const fromUserId = response.locals?.auth?.userId;
    const toUserId = request.params?.userId;

    const result = await this.followUseCase.execute({ fromUserId, toUserId });

    return response.status(200).json(result);
  };

  unfollow = async (request: Request, response: Response) => {
    const fromUserId = response.locals?.auth?.userId;
    const toUserId = request.params?.userId;

    const result = await this.unfollowUseCase.execute({ fromUserId, toUserId });

    return response.status(200).json(result);
  };

  removefollow = async (request: Request, response: Response) => {
    const fromUserId = response.locals?.auth?.userId;
    const toUserId = request.params?.userId;

    const result = await this.removefollowUseCase.execute({ fromUserId, toUserId });

    return response.status(200).json(result);
  };

  cancelFollowRequest = async (request: Request, response: Response) => {
    const fromUserId = response.locals?.auth?.userId;
    const toUserId = request.params?.userId;

    const result = await this.cancelFollowRequestUseCase.execute({ fromUserId, toUserId });

    return response.status(200).json(result);
  };

  acceptFollowRequest = async (request: Request, response: Response) => {
    const fromUserId = request.params?.requesterId;
    const toUserId = response.locals?.auth?.userId;

    const result = await this.acceptFollowRequestUseCase.execute({ fromUserId, toUserId });

    return response.status(200).json(result);
  };

  rejectFollowRequest = async (request: Request, response: Response) => {
    const fromUserId = request.params?.requesterId;
    const toUserId = response.locals?.auth?.userId;

    const result = await this.rejectFollowRequestUseCase.execute({ fromUserId, toUserId });

    return response.status(200).json(result);
  };

  getFollowers = async (request: Request, response: Response) => {
    const userId = request.params?.userId;
    const viewerId = response.locals?.auth?.userId;

    const result = await this.getFollowersUsecase.execute({ viewerId, userId, ...request.query });

    return response.status(200).json(result);
  };

  getFollowing = async (request: Request, response: Response) => {
    const userId = request.params?.userId;
    const viewerId = response.locals?.auth?.userId;

    const result = await this.getFollowingUsecase.execute({ viewerId, userId, ...request.query });

    return response.status(200).json(result);
  };
}

export default FollowController;
