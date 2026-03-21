import { UserEntity } from "@/domain/user";
import { MediaMapper, MediaVariantMap } from "./media.mapper";
import { MediaEntity } from "@/domain/media/media.entity";
import { IFileStorageService } from "../services";

export interface AuthorDTO {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: MediaVariantMap;
  isVerified: boolean;
}

export class UserMapper {
  static toAuthorDTO(
    user: UserEntity,
    mediaMap: Record<string, MediaEntity>,
    fileStorageService: IFileStorageService,
  ): AuthorDTO {
    if (!user.id) {
      throw new Error("Cannot map UserEntity to AuthorDTO without id");
    }

    return {
      id: user.id,
      username: user.data.username,
      displayName: user.fullName,
      isVerified: user.data.isVerified,
      profilePicture: MediaMapper.resolveVariantMap(
        user.data.profilePicture,
        mediaMap,
        fileStorageService,
      ),
    };
  }
}
