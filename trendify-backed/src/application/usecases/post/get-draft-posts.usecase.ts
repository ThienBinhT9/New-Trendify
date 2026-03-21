import * as Response from "@/shared/responses";
import { GetDraftPostsDTO } from "@/application/dtos/post.dto";
import { EPostStatus, IPostRepository } from "@/domain/post";
import { ECommonVisibility } from "@/domain/user-setting";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import { batchResolveMediaDisplays } from "@/application/mappers/media.mapper";
import { PostMapper, UserMapper } from "@/application/mappers";
import { MediaEntity } from "@/domain/media";

export class GetDraftPostsUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly userRepo: IUserRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetDraftPostsDTO) {
    const { userId, limit = 20, cursor, type } = dto;

    const author = await this.userRepo.findById(userId);
    if (!author) {
      throw new Response.NotFoundError("User not found");
    }

    const authorProfileMedia =
      author.data.profilePicture && typeof author.data.profilePicture === "string"
        ? await this.mediaRepo.findById(author.data.profilePicture)
        : undefined;

    const authorMediaRecord: Record<string, MediaEntity> = {};
    if (authorProfileMedia?.id) {
      authorMediaRecord[authorProfileMedia.id] = authorProfileMedia;
    }

    const authorMapped = UserMapper.toAuthorDTO(author, authorMediaRecord, this.storageSvc);

    const result = await this.postRepo.findByUser({
      authorId: userId,
      statuses: [EPostStatus.DRAFT],
      visibilities: [
        ECommonVisibility.PUBLIC,
        ECommonVisibility.FOLLOWER,
        ECommonVisibility.PRIVATE,
      ],
      limit,
      cursor,
      type,
      pinnedFirst: false,
    });

    const postIds = result.posts.map((p) => p.id!);
    const [likedPostIds, savedPostIds, mediaDisplayMap] = await Promise.all([
      this.likeRepo.findLikedPostIds(userId, postIds),
      this.saveRepo.findSavedPostIds(userId, postIds),
      batchResolveMediaDisplays(
        result.posts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
    ]);

    const posts = result.posts.map((post) => {
      const isLiked = likedPostIds.has(post.id!);
      const isSaved = savedPostIds.has(post.id!);

      return PostMapper.toResponseDTO(
        post,
        authorMapped,
        mediaDisplayMap.get(post.id!) ?? [],
        ViewerContextBuilder.buildPost({
          viewerId: userId,
          postAuthorId: post.authorId,
          postSettings: post.data.settings,
          isLiked,
          isSaved,
          isFollowingAuthor: false,
          isBlocked: false,
        }),
      );
    });

    return new Response.SuccessResponse({
      message: "Draft posts retrieved successfully",
      data: {
        posts,
        nextCursor: result.nextCursor,
      },
    });
  }
}
