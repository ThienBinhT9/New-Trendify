import * as Response from "@/shared/responses";
import { CreatePostDTO } from "@/application/dtos/post.dto";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { PostEntity } from "@/domain/post";
import {
  validateAndFetchMedia,
  determinePostType,
  resolveMediaDisplayList,
  toMediaRecord,
} from "@/application/mappers/media.mapper";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import { PostMapper, UserMapper } from "@/application/mappers";

export class CreatePostUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: CreatePostDTO) {
    const { authorId, mediaIds = [] } = dto;

    const mediaEntities = await validateAndFetchMedia(mediaIds, authorId, (ids) =>
      this.mediaRepo.findByIds(ids),
    );

    const postType = determinePostType(mediaEntities);
    const uow = await this.uowFactory.create();

    try {
      const post = PostEntity.create({ ...dto, mediaIds, type: postType });

      const created = await uow.posts.create(post);
      if (!created) {
        throw new Response.BadRequestError("Failed to create post");
      }

      await uow.users.incrementPostCount(authorId);
      await uow.commit();

      const author = await uow.users.findById(authorId);
      if (!author) {
        throw new Response.NotFoundError("Author not found");
      }

      const mediaRecord = toMediaRecord(mediaEntities);

      const profilePictureId = author.data.profilePicture;
      if (profilePictureId && !mediaRecord[profilePictureId]) {
        const profileMedia = await this.mediaRepo.findById(profilePictureId);
        if (profileMedia?.id) {
          mediaRecord[profileMedia.id] = profileMedia;
        }
      }

      const media = resolveMediaDisplayList(created.mediaIds, mediaRecord, this.storageSvc);

      const authorMapped = UserMapper.toAuthorDTO(author, mediaRecord, this.storageSvc);

      // Build viewer context
      const viewerContext = ViewerContextBuilder.buildPost({
        viewerId: authorId,
        postAuthorId: created.authorId,
        postSettings: created.data.settings,
        isLiked: false,
        isSaved: false,
        isFollowingAuthor: false,
        isBlocked: false,
      });

      return PostMapper.toResponseDTO(created, authorMapped, media, viewerContext);
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
