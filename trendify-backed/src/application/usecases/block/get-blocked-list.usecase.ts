import * as Response from "@/shared/responses";

import { GetBlockedListDTO } from "@/application/dtos/block.dto";
import { IBlockRepository } from "@/domain/block";
import { IUserRepository } from "@/domain/user";

export class GetBlockedListUsecase {
  constructor(
    private readonly blockRepo: IBlockRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: GetBlockedListDTO) {
    const { userId, cursor, limit = 10 } = dto;

    // Step 1: Get blocked user IDs with pagination
    const { blocks, nextCursor } = await this.blockRepo.findBlockedByUser(userId, {
      limit,
      cursor,
    });

    if (blocks.length === 0) {
      return new Response.SuccessResponse({
        data: { users: [], nextCursor: null, hasNext: false },
      });
    }

    // Step 2: Get user details for blocked users
    const blockedUserIds = blocks.map((block) => block.data.blockedId);
    const users = await this.userRepo.findByIds(blockedUserIds);

    // Step 3: Map to response format with block info
    const userMap = new Map(users.map((user) => [user.id, user]));

    const blockedUsers = blocks.map((block) => {
      const user = userMap.get(block.data.blockedId);
      return {
        id: block.data.blockedId,
        username: user?.data.username,
        firstName: user?.data.firstName,
        lastName: user?.data.lastName,
        profilePicture: user?.data.profilePicture,
        blockedAt: block.data.createdAt,
      };
    });

    return new Response.SuccessResponse({
      data: { users: blockedUsers, nextCursor: nextCursor || null, hasNext: !!nextCursor },
    });
  }
}
