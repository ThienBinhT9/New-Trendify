import * as Response from "@/shared/responses";
import { CreatePostDTO } from "@/application/dtos/post.dto";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { EVariantType, IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { PostEntity } from "@/domain/post";
import {
  validateAndFetchMedia,
  determinePostType,
  batchPopulateMedia,
} from "./media-display.mapper";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";

export class CreatePostUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: CreatePostDTO) {
    const { authorId, mediaIds = [] } = dto;

    const mediaEntities = await validateAndFetchMedia(mediaIds, authorId, {
      findByIds: (ids) => this.mediaRepo.findByIds(ids),
    });

    const postType = determinePostType(mediaEntities);
    const uow = await this.uowFactory.create();

    try {
      const post = PostEntity.create({
        authorId,
        type: postType,
        content: dto.content,
        mediaIds,
        mentions: dto.mentions,
        location: dto.location,
        visibility: dto.visibility,
        replyToId: dto.replyToId,
        isDraft: dto.isDraft,
      });

      const created = await uow.posts.create(post);
      if (!created) {
        throw new Response.BadRequestError("Failed to create post");
      }

      await uow.users.incrementPostCount(authorId);
      await uow.commit();

      const mediaDisplayMap = await batchPopulateMedia(
        [{ id: created.id!, mediaIds: created.mediaIds }],
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      );

      const author = await uow.users.findById(authorId);

      // Build viewer context
      const viewerContext = ViewerContextBuilder.buildPost({
        viewerId: authorId,
        postAuthorId: post.authorId,
        postSettings: post.data.settings,
        isLiked: false,
        isSaved: false,
        isFollowingAuthor: false,
        isBlocked: false,
      });

      let profilePictureUrl: string | undefined = undefined;
      if (author?.data.profilePicture && typeof author.data.profilePicture === "string") {
        const profileMedia = await this.mediaRepo.findById(author.data.profilePicture);
        if (profileMedia) {
          const smallVariant = profileMedia.variants.find((v) => v.type === EVariantType.SMALL);
          const key = smallVariant ? smallVariant.key : profileMedia.key;
          profilePictureUrl = this.storageSvc.getPublicUrl(key);
        }
      }

      return new Response.SuccessResponse({
        statusCode: 201,
        message: "Post created successfully",
        data: {
          post: {
            ...created.toSnapshot(),
            author: {
              id: author?.id,
              username: author?.data.username,
              firstName: author?.data.firstName,
              lastName: author?.data.lastName,
              profilePicture: profilePictureUrl,
            },
            media: mediaDisplayMap.get(created.id!) ?? [],
          },
          viewerContext,
        },
      });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
