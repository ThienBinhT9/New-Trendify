import { IPostSettings } from "@/domain/post";

export interface IUserViewerContext {
  isSelf: boolean;
  isFollowing: boolean;
  isRequested: boolean;
  isFollowedBy: boolean;
  isRequestedByThem: boolean;

  canFollow: boolean;
}

interface IUserViewerContextInput {
  viewerId: string;
  targetId: string;

  isFollowing: boolean;
  isRequested: boolean;
  isFollowedBy: boolean;
  isRequestedByThem?: boolean;
}

export interface IPostViewerContext {
  isAuthor: boolean;
  isFollowingAuthor: boolean;
  isLiked: boolean;
  isSaved: boolean;

  canLike: boolean;
  canSave: boolean;
  canShare: boolean;
  canComment: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface IPostViewerContextInput {
  viewerId?: string | null;
  postAuthorId: string;
  postSettings: IPostSettings;

  isLiked: boolean;
  isSaved: boolean;
  isFollowingAuthor: boolean;

  isBlocked?: boolean;
  isAuthorProfilePrivate?: boolean;
}

export class ViewerContextBuilder {
  private static readonly GUEST_POST_CONTEXT: IPostViewerContext = {
    isAuthor: false,
    isFollowingAuthor: false,
    isLiked: false,
    isSaved: false,
    canLike: false,
    canSave: false,
    canShare: true,
    canComment: false,
    canEdit: false,
    canDelete: false,
  };

  static buildUser(input: IUserViewerContextInput): IUserViewerContext {
    const {
      viewerId,
      targetId,
      isFollowing,
      isRequested,
      isFollowedBy,
      isRequestedByThem = false,
    } = input;

    const isSelf = viewerId === targetId;

    const canFollow = !isSelf;

    return {
      isSelf,
      isFollowing,
      isRequested,
      isFollowedBy,
      isRequestedByThem,
      canFollow,
    };
  }

  static buildPost(input: IPostViewerContextInput): IPostViewerContext {
    const {
      postAuthorId,
      postSettings,
      viewerId,
      isLiked,
      isSaved,
      isFollowingAuthor,
      isBlocked = false,
      isAuthorProfilePrivate = false,
    } = input;

    if (!viewerId) {
      return { ...this.GUEST_POST_CONTEXT, canShare: postSettings.allowShare };
    }

    const isAuthor = viewerId === postAuthorId;

    const isRestricted = isBlocked || (isAuthorProfilePrivate && !isFollowingAuthor && !isAuthor);

    return {
      isAuthor,
      isFollowingAuthor,
      isLiked,
      isSaved,

      canLike: !isRestricted && !isLiked && postSettings.allowLike,
      canSave: !isRestricted && !isSaved && postSettings.allowSave,
      canShare: !isBlocked && postSettings.allowShare,
      canComment: !isRestricted && postSettings.allowComment,
      canEdit: isAuthor,
      canDelete: isAuthor,
    };
  }
}
