import { IPostRepository } from "@/domain/post";
import { UpdatePostDTO } from "@/application/dtos/post.dto";
import * as Response from "@/shared/responses";

export class UpdatePostUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(dto: UpdatePostDTO) {
    const post = await this.postRepo.findById(dto.postId);
    if (!post) {
      throw new Response.NotFoundError("Post not found");
    }

    if (!post.isOwnedBy(dto.authorId)) {
      throw new Response.ForbiddenError("You are not allowed to modify this post");
    }

    // Update settings (visibility, allowLike, etc.)
    const settingsUpdate: Record<string, unknown> = {};
    if (dto.visibility !== undefined) settingsUpdate.visibility = dto.visibility;
    if (dto.allowLike !== undefined) settingsUpdate.allowLike = dto.allowLike;
    if (dto.allowSave !== undefined) settingsUpdate.allowSave = dto.allowSave;
    if (dto.allowShare !== undefined) settingsUpdate.allowShare = dto.allowShare;
    if (dto.allowComment !== undefined) settingsUpdate.allowComment = dto.allowComment;
    if (dto.allowDownload !== undefined) settingsUpdate.allowDownload = dto.allowDownload;

    if (Object.keys(settingsUpdate).length > 0) {
      post.updateSettings(settingsUpdate);
    }

    // Update content
    if (dto.content !== undefined || dto.mentions !== undefined) {
      post.updateContent(dto.content, dto.mentions);
    }

    // Update location
    if (dto.location !== undefined) {
      post.updateLocation(dto.location);
    }

    const updated = await this.postRepo.update(post);
    if (!updated) {
      throw new Error("Failed to update post");
    }

    return new Response.SuccessResponse({
      message: "Post updated successfully",
      data: {
        id: updated.id,
        settings: updated.data.settings,
        content: updated.data.content,
        location: updated.data.location,
      },
    });
  }
}
