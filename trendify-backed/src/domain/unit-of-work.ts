import { IBlockRepository } from "./block";
import { ICommentRepository } from "./comment";
import { IFollowRepository } from "./follow";
import { ILikeRepository } from "./like";
import { IPostRepository } from "./post";
import { ISaveRepository } from "./save";
import { ISessionRepository } from "./session";
import { IUserSettingsRepository } from "./user-setting";
import { IUserRepository } from "./user";
import { IUserIntentRepository } from "./user-intent";

export interface IUnitOfWork {
  readonly sessions: ISessionRepository;

  readonly users: IUserRepository;
  readonly userIntent: IUserIntentRepository;

  readonly follows: IFollowRepository;

  readonly posts: IPostRepository;
  readonly likes: ILikeRepository;
  readonly saves: ISaveRepository;
  readonly comments: ICommentRepository;

  readonly userSettings: IUserSettingsRepository;

  readonly blocks: IBlockRepository;

  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface IUnitOfWorkFactory {
  create(): Promise<IUnitOfWork>;
}
