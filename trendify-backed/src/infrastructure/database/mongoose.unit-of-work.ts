import mongoose from "mongoose";
import { IUnitOfWork, IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { ClientSession } from "mongoose";
import {
  MongooseUserRepository,
  MongooseUserIntentRepository,
  MongooseSessionRepository,
  MongooseFollowRepository,
  MongoosePostRepository,
  MongooseSettingsRepository,
  MongooseBlockRepository,
  MongooseLikeRepository,
  MongooseSaveRepository,
  MongooseCommentRepository,
} from "./repositories";
import { MongooseConversationRepository } from "./repositories/conversation.repository.impl";
import { MongooseMessageRepository } from "./repositories/message.repository.impl";
import { MongooseMessageRequestRepository } from "./repositories/message-request.repository.impl";

export class MongooseUnitOfWork implements IUnitOfWork {
  private _userRepo?: MongooseUserRepository;
  private _sessionRepo?: MongooseSessionRepository;
  private _userIntentRepo?: MongooseUserIntentRepository;
  private _followRepo?: MongooseFollowRepository;
  private _postRepo?: MongoosePostRepository;
  private _settingRepo?: MongooseSettingsRepository;
  private _blockRepo?: MongooseBlockRepository;
  private _likeRepo?: MongooseLikeRepository;
  private _saveRepo?: MongooseSaveRepository;
  private _commentRepo?: MongooseCommentRepository;
  private _conversationRepo?: MongooseConversationRepository;
  private _messageRepo?: MongooseMessageRepository;
  private _messageRequestRepo?: MongooseMessageRequestRepository;

  constructor(private readonly session: ClientSession) {}

  get users() {
    return (this._userRepo ??= new MongooseUserRepository(this.session));
  }

  get sessions() {
    return (this._sessionRepo ??= new MongooseSessionRepository(this.session));
  }

  get userIntent() {
    return (this._userIntentRepo ??= new MongooseUserIntentRepository(this.session));
  }

  get follows() {
    return (this._followRepo ??= new MongooseFollowRepository(this.session));
  }

  get posts() {
    return (this._postRepo ??= new MongoosePostRepository(this.session));
  }

  get userSettings() {
    return (this._settingRepo ??= new MongooseSettingsRepository(this.session));
  }

  get blocks() {
    return (this._blockRepo ??= new MongooseBlockRepository(this.session));
  }

  get likes() {
    return (this._likeRepo ??= new MongooseLikeRepository(this.session));
  }

  get saves() {
    return (this._saveRepo ??= new MongooseSaveRepository(this.session));
  }

  get comments() {
    return (this._commentRepo ??= new MongooseCommentRepository(this.session));
  }

  get conversations() {
    return (this._conversationRepo ??= new MongooseConversationRepository(this.session));
  }

  get messages() {
    return (this._messageRepo ??= new MongooseMessageRepository(this.session));
  }

  get messageRequests() {
    return (this._messageRequestRepo ??= new MongooseMessageRequestRepository(this.session));
  }

  async commit(): Promise<void> {
    await this.session.commitTransaction();
    this.session.endSession();
  }

  async rollback(): Promise<void> {
    await this.session.abortTransaction();
    this.session.endSession();
  }
}

export class MongooseUnitOfWorkFactory implements IUnitOfWorkFactory {
  constructor(private readonly connection: mongoose.Connection) {}

  async create(): Promise<IUnitOfWork> {
    const session = await this.connection.startSession();
    session.startTransaction();
    return new MongooseUnitOfWork(session);
  }
}
