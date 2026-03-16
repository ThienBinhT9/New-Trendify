export interface IAvatar {
  id: string;
  path: string;
  name: string;
}

export interface ICommentAuthor {
  id: string;
  username: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
}

export interface ICommentMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface ICommentHashtag {
  tag: string;
  startIndex: number;
  endIndex: number;
}

export interface ICommentCounters {
  likeCount: number;
  replyCount: number;
}

export interface IComment {
  id: string;
  postId: string;
  content: string;
  mentions: ICommentMention[];
  hashtags: ICommentHashtag[];
  author: ICommentAuthor;
  isLiked: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  counters: ICommentCounters;
}
