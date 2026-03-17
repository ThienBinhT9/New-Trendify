import * as Response from "@/shared/responses";
import { CreatePostDTO } from "@/application/dtos/post.dto";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { PostEntity } from "@/domain/post";
import {
  validateAndFetchMedia,
  determinePostType,
  batchPopulateMedia,
} from "./media-display.mapper";

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

      // Fetch author info to return
      let profilePictureUrl: string | undefined = undefined;
      const user = await uow.users.findById(authorId);
      
      if (user?.data.profilePicture) {
        // If profilePicture is a string (id), fetch the media entity
        if (typeof user.data.profilePicture === 'string') {
          const profileMedia = await this.mediaRepo.findById(user.data.profilePicture);
          if (profileMedia) {
             // Find 'small' variant or fallback to original
             const smallVariant = profileMedia.variants.find(v => v.type === 'small');
             const key = smallVariant ? smallVariant.key : profileMedia.key;
             profilePictureUrl = this.storageSvc.getPublicUrl(key);
          }
        }
      }

      return new Response.SuccessResponse({
        statusCode: 201,
        message: "Post created successfully",
        data: {
          post: {
            ...created.toSnapshot(),
            author: user ? {
              id: user.id,
              username: user.data.username,
              firstName: user.data.firstName,
              lastName: user.data.lastName,
              profilePicture: profilePictureUrl
            } : { id: authorId },
            media: mediaDisplayMap.get(created.id!) ?? [],
          },
        },
      });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
