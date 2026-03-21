import * as Response from "@/shared/responses";
import { GetPostDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { IFollowRepository } from "@/domain/follow";
import { IBlockRepository } from "@/domain/block";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ICacheService } from "@/application/services";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import { PostMapper, UserMapper } from "@/application/mappers";
import {
  fetchMediaRecordFromGroups,
  resolveMediaDisplayList,
} from "@/application/mappers/media.mapper";

export class GetPostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly userRepo: IUserRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly followRepo: IFollowRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly cacheService: ICacheService,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetPostDTO) {
    const { viewerId, postId } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || !post.isActive()) {
      throw new Response.NotFoundError("Post not found");
    }

    const isBlocked = await this.blockRepo.isEitherBlocked(viewerId, post.authorId);
    if (isBlocked && !post.isOwnedBy(viewerId)) {
      throw new Response.NotFoundError("Post not found");
    }

    const isFollowingAuthor =
      viewerId !== post.authorId ? await this.followRepo.exists(viewerId, post.authorId) : false;

    if (post.isPrivate() && !post.isOwnedBy(viewerId)) {
      throw new Response.NotFoundError("Post not found");
    }
    if (post.isFollowerOnly() && !isFollowingAuthor && !post.isOwnedBy(viewerId)) {
      throw new Response.NotFoundError("Post not found");
    }

    const [isLiked, isSaved] = await Promise.all([
      this.likeRepo.exists(viewerId, postId),
      this.saveRepo.exists(viewerId, postId),
    ]);

    const viewerContext = ViewerContextBuilder.buildPost({
      viewerId,
      postAuthorId: post.authorId,
      postSettings: post.data.settings,
      isLiked,
      isSaved,
      isFollowingAuthor,
      isBlocked,
    });

    const author = await this.userRepo.findById(post.authorId);
    if (!author) {
      throw new Response.NotFoundError("Author not found");
    }

    const profilePictureId =
      typeof author.data.profilePicture === "string" ? author.data.profilePicture : undefined;
    const mediaRecord = await fetchMediaRecordFromGroups(
      [post.mediaIds, [profilePictureId]],
      (ids) => this.mediaRepo.findByIds(ids),
    );
    const media = resolveMediaDisplayList(post.mediaIds, mediaRecord, this.storageSvc);

    const authorMapped = UserMapper.toAuthorDTO(author, mediaRecord, this.storageSvc);

    return PostMapper.toResponseDTO(post, authorMapped, media, viewerContext);
  }
}
