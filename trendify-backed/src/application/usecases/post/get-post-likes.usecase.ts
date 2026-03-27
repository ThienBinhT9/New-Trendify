import * as Response from "@/shared/responses";
import { GetPostLikesDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ILikeRepository } from "@/domain/like";
import { IUserRepository } from "@/domain/user";
import { IFollowRepository } from "@/domain/follow";
import { IMediaRepository, MediaEntity } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";

export class GetPostLikesUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly userRepo: IUserRepository,
    private readonly followRepo: IFollowRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetPostLikesDTO) {
    const { viewerId, postId, limit = 20, cursor } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const result = await this.likeRepo.findByPost(postId, limit, cursor);

    // Enrich with user info
    const userIds = result.likes.map((l) => l.userId);
    const [users, followerIds, followData] = await Promise.all([
      this.userRepo.findByIds(userIds, {
        fields: ["username", "firstName", "lastName", "profilePicture", "isVerified"],
      }),
      this.followRepo.findFollowedIds(viewerId, userIds),
      this.followRepo.findUserFollowData(viewerId, userIds),
    ]);
    const userMap = new Map(users.map((u) => [u.id!, u]));

    const profilePictureIds = users
      .map((u) => u.data.profilePicture)
      .filter((id): id is string => !!id);
    const mediaMap = await this.batchResolveProfilePictures(profilePictureIds);

    const likes = result.likes.map((like) => {
      const user = userMap.get(like.userId);
      if (!user || !user.id) return null;

      return {
        id: user.id,
        userId: like.userId,
        username: user?.data.username,
        firstName: user?.data.firstName,
        lastName: user?.data.lastName,
        profilePicture: user.data.profilePicture
          ? (mediaMap.get(user.data.profilePicture) ?? null)
          : null,
        viewerContext: ViewerContextBuilder.buildUser({
          viewerId,
          targetId: user.id,
          isFollowing: followData.followingIds.has(user.id),
          isRequested: followData.pendingRequestIds.has(user.id),
          isFollowedBy: followerIds.has(user.id),
        }),
        createdAt: like.data.createdAt,
      };
    });

    return new Response.SuccessResponse({
      message: "Likes retrieved successfully",
      data: {
        likes: likes.filter((like) => !!like),
        nextCursor: result.nextCursor,
      },
    });
  }

  private async batchResolveProfilePictures(ids: string[]) {
    const result = new Map<string, Record<string, string>>();
    if (!ids.length) return result;

    const mediaList = await this.mediaRepo.findByIds(ids);

    for (const media of mediaList) {
      if (media.id) {
        result.set(media.id, this.mapVariantsToUrls(media));
      }
    }

    return result;
  }

  private mapVariantsToUrls(media: MediaEntity) {
    const variantMap: Record<string, string> = {};
    variantMap["original"] = this.storageSvc.getPublicUrl(media.key);
    media.variants.forEach((variant) => {
      variantMap[variant.type] = this.storageSvc.getPublicUrl(variant.key);
    });
    return variantMap;
  }
}
