import { Types, ClientSession } from "mongoose";

import {
  IMessageRepository,
  MessageEntity,
  IMessageProps,
  IMessageReaction,
  IMessageReadReceipt,
  MessageReactionEmoji,
} from "@/domain/chat";
import { MessageModel } from "../models/message.model";
import { BaseRepository } from "./base.repository";

export class MongooseMessageRepository
  extends BaseRepository<MessageEntity, IMessageProps>
  implements IMessageRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(entity: MessageEntity): Promise<MessageEntity> {
    const data = entity.data;

    const doc = await MessageModel.create(
      [
        {
          conversationId: new Types.ObjectId(data.conversationId),
          senderId: new Types.ObjectId(data.senderId),
          type: data.type,
          content: data.content ?? null,
          mediaIds: (data.mediaIds ?? []).map((id) => new Types.ObjectId(id)),
          replyToId: data.replyToId ? new Types.ObjectId(data.replyToId) : null,
          forwardedFromId: data.forwardedFromId
            ? new Types.ObjectId(data.forwardedFromId)
            : null,
          reactions: [],
          readBy: data.readBy.map((r) => ({
            userId: new Types.ObjectId(r.userId),
            readAt: r.readAt,
          })),
          deliveredTo: data.deliveredTo.map((id) => new Types.ObjectId(id)),
          deletedFor: [],
          isUnsent: false,
        },
      ],
      { session: this.session },
    );

    return this.mapToEntity(doc[0].toObject() as unknown as Record<string, unknown>, MessageEntity);
  }

  async findById(id: string): Promise<MessageEntity | null> {
    const doc = await MessageModel.findById(id).lean();
    if (!doc) return null;
    return this.mapToEntity(doc as unknown as Record<string, unknown>, MessageEntity);
  }

  /**
   * Cursor-based pagination: newest messages first.
   * Filters out messages deleted for the requesting user.
   */
  async findByConversation(
    conversationId: string,
    options: {
      limit: number;
      cursor?: string;
      userId: string;
    },
  ): Promise<{ messages: MessageEntity[]; nextCursor?: string }> {
    const query: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
      deletedFor: { $ne: new Types.ObjectId(options.userId) },
    };

    if (options.cursor) {
      query._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const docs = await MessageModel.find(query)
      .sort({ _id: -1 })
      .limit(options.limit + 1)
      .lean();

    const hasNext = docs.length > options.limit;
    const sliced = hasNext ? docs.slice(0, options.limit) : docs;

    return {
      messages: sliced.map((doc) => this.mapToEntity(doc as unknown as Record<string, unknown>, MessageEntity)),
      nextCursor: hasNext
        ? sliced[sliced.length - 1]._id.toString()
        : undefined,
    };
  }

  /**
   * Full-text search within a conversation.
   * Uses MongoDB $text index with textScore ranking.
   */
  async searchInConversation(
    conversationId: string,
    query: string,
    options: {
      limit: number;
      cursor?: string;
      userId: string;
    },
  ): Promise<{ messages: MessageEntity[]; nextCursor?: string }> {
    const filter: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
      $text: { $search: query },
      isUnsent: false,
      deletedFor: { $ne: new Types.ObjectId(options.userId) },
    };

    if (options.cursor) {
      filter._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const docs = await MessageModel.find(filter, {
      score: { $meta: "textScore" },
    })
      .sort({ score: { $meta: "textScore" }, _id: -1 })
      .limit(options.limit + 1)
      .lean();

    const hasNext = docs.length > options.limit;
    const sliced = hasNext ? docs.slice(0, options.limit) : docs;

    return {
      messages: sliced.map((doc) => this.mapToEntity(doc as unknown as Record<string, unknown>, MessageEntity)),
      nextCursor: hasNext
        ? sliced[sliced.length - 1]._id.toString()
        : undefined,
    };
  }

  /**
   * Add reaction using $pull + $push to ensure 1 reaction per user.
   */
  async addReaction(messageId: string, reaction: IMessageReaction): Promise<void> {
    const msgOid = new Types.ObjectId(messageId);
    const userOid = new Types.ObjectId(reaction.userId);

    // Remove any existing reaction from this user
    await MessageModel.updateOne(
      { _id: msgOid },
      { $pull: { reactions: { userId: userOid } } },
    );

    // Add new reaction
    await MessageModel.updateOne(
      { _id: msgOid },
      {
        $push: {
          reactions: {
            userId: userOid,
            emoji: reaction.emoji,
            createdAt: reaction.createdAt,
          },
        },
      },
    );
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: MessageReactionEmoji,
  ): Promise<void> {
    await MessageModel.updateOne(
      { _id: new Types.ObjectId(messageId) },
      {
        $pull: {
          reactions: {
            userId: new Types.ObjectId(userId),
            emoji,
          },
        },
      },
    );
  }

  async markAsRead(
    messageId: string,
    readReceipt: IMessageReadReceipt,
  ): Promise<void> {
    await MessageModel.updateOne(
      {
        _id: new Types.ObjectId(messageId),
        "readBy.userId": { $ne: new Types.ObjectId(readReceipt.userId) },
      },
      {
        $addToSet: {
          readBy: {
            userId: new Types.ObjectId(readReceipt.userId),
            readAt: readReceipt.readAt,
          },
        },
      },
    );
  }

  /**
   * Bulk mark all messages up to a certain point as read.
   * Returns count of newly marked messages.
   */
  async markManyAsRead(
    conversationId: string,
    userId: string,
    upToMessageId: string,
  ): Promise<number> {
    const userOid = new Types.ObjectId(userId);
    const now = new Date();

    const result = await MessageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        _id: { $lte: new Types.ObjectId(upToMessageId) },
        "readBy.userId": { $ne: userOid },
        senderId: { $ne: userOid }, // Don't need to mark own messages as read
      },
      {
        $addToSet: {
          readBy: { userId: userOid, readAt: now },
        },
      },
    );

    return result.modifiedCount;
  }

  async unsendMessage(messageId: string): Promise<void> {
    await MessageModel.updateOne(
      { _id: new Types.ObjectId(messageId) },
      {
        $set: {
          isUnsent: true,
          unsentAt: new Date(),
          content: null,
          mediaIds: [],
        },
      },
    );
  }

  async deleteForUser(messageId: string, userId: string): Promise<void> {
    await MessageModel.updateOne(
      { _id: new Types.ObjectId(messageId) },
      {
        $addToSet: { deletedFor: new Types.ObjectId(userId) },
      },
    );
  }

  async markAsDelivered(messageIds: string[], userId: string): Promise<void> {
    if (messageIds.length === 0) return;

    const userOid = new Types.ObjectId(userId);

    await MessageModel.updateMany(
      {
        _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
        deliveredTo: { $ne: userOid },
      },
      {
        $addToSet: { deliveredTo: userOid },
      },
    );
  }

  async countUnread(
    conversationId: string,
    userId: string,
    sinceMessageId?: string,
  ): Promise<number> {
    const userOid = new Types.ObjectId(userId);

    const query: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
      senderId: { $ne: userOid },
      "readBy.userId": { $ne: userOid },
      deletedFor: { $ne: userOid },
      isUnsent: false,
    };

    if (sinceMessageId) {
      query._id = { $gt: new Types.ObjectId(sinceMessageId) };
    }

    return MessageModel.countDocuments(query);
  }

  async findByIds(ids: string[]): Promise<MessageEntity[]> {
    if (ids.length === 0) return [];

    const docs = await MessageModel.find({
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    }).lean();

    return docs.map((doc) => this.mapToEntity(doc as unknown as Record<string, unknown>, MessageEntity));
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    await MessageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: Record<string, unknown>,
    EntityClass: new (props: IMessageProps, id?: string) => MessageEntity,
  ): MessageEntity {
    if (!doc) throw new Error("Document not found");

    const {
      _id,
      __v,
      score, // textScore from search — discard
      conversationId,
      senderId,
      mediaIds,
      replyToId,
      forwardedFromId,
      reactions,
      readBy,
      deliveredTo,
      deletedFor,
      createdAt,
      updatedAt,
      ...rest
    } = doc as Record<string, any>;

    const props: IMessageProps = {
      conversationId: conversationId.toString(),
      senderId: senderId.toString(),
      type: rest.type,
      content: rest.content ?? undefined,
      mediaIds: Array.isArray(mediaIds)
        ? mediaIds.map((id: Types.ObjectId) => id.toString())
        : [],
      replyToId: replyToId?.toString() ?? undefined,
      forwardedFromId: forwardedFromId?.toString() ?? undefined,
      reactions: Array.isArray(reactions)
        ? reactions.map((r: Record<string, any>) => ({
            userId: r.userId.toString(),
            emoji: r.emoji as MessageReactionEmoji,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          }))
        : [],
      readBy: Array.isArray(readBy)
        ? readBy.map((r: Record<string, any>) => ({
            userId: r.userId.toString(),
            readAt: r.readAt ? new Date(r.readAt) : new Date(),
          }))
        : [],
      deliveredTo: Array.isArray(deliveredTo)
        ? deliveredTo.map((id: Types.ObjectId) => id.toString())
        : [],
      deletedFor: Array.isArray(deletedFor)
        ? deletedFor.map((id: Types.ObjectId) => id.toString())
        : [],
      isUnsent: rest.isUnsent ?? false,
      unsentAt: rest.unsentAt ? new Date(rest.unsentAt) : undefined,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }
}
