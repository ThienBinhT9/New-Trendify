import { Types, ClientSession } from "mongoose";

import {
  IMessageRequestRepository,
  MessageRequestEntity,
  IMessageRequestProps,
  EMessageRequestStatus,
} from "@/domain/chat";
import { MessageRequestModel } from "../models/message-request.model";
import { BaseRepository } from "./base.repository";

export class MongooseMessageRequestRepository
  extends BaseRepository<MessageRequestEntity, IMessageRequestProps>
  implements IMessageRequestRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(entity: MessageRequestEntity): Promise<MessageRequestEntity> {
    const data = entity.data;

    const doc = await MessageRequestModel.create(
      [
        {
          senderId: new Types.ObjectId(data.senderId),
          recipientId: new Types.ObjectId(data.recipientId),
          conversationId: new Types.ObjectId(data.conversationId),
          status: data.status,
          message: data.message ?? null,
        },
      ],
      { session: this.session },
    );

    return this.mapToEntity(doc[0].toObject() as unknown as Record<string, unknown>, MessageRequestEntity);
  }

  async findById(id: string): Promise<MessageRequestEntity | null> {
    const doc = await MessageRequestModel.findById(id).lean();
    if (!doc) return null;
    return this.mapToEntity(doc as unknown as Record<string, unknown>, MessageRequestEntity);
  }

  async findPending(
    senderId: string,
    recipientId: string,
  ): Promise<MessageRequestEntity | null> {
    const doc = await MessageRequestModel.findOne({
      senderId: new Types.ObjectId(senderId),
      recipientId: new Types.ObjectId(recipientId),
      status: EMessageRequestStatus.PENDING,
    }).lean();

    if (!doc) return null;
    return this.mapToEntity(doc as unknown as Record<string, unknown>, MessageRequestEntity);
  }

  async findByRecipient(
    recipientId: string,
    options: {
      limit: number;
      cursor?: string;
      status?: EMessageRequestStatus;
    },
  ): Promise<{ requests: MessageRequestEntity[]; nextCursor?: string }> {
    const query: Record<string, unknown> = {
      recipientId: new Types.ObjectId(recipientId),
    };

    if (options.status) {
      query.status = options.status;
    }

    if (options.cursor) {
      query._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const docs = await MessageRequestModel.find(query)
      .sort({ _id: -1 })
      .limit(options.limit + 1)
      .lean();

    const hasNext = docs.length > options.limit;
    const sliced = hasNext ? docs.slice(0, options.limit) : docs;

    return {
      requests: sliced.map((doc) =>
        this.mapToEntity(doc as unknown as Record<string, unknown>, MessageRequestEntity),
      ),
      nextCursor: hasNext
        ? sliced[sliced.length - 1]._id.toString()
        : undefined,
    };
  }

  async updateStatus(
    requestId: string,
    status: EMessageRequestStatus,
  ): Promise<void> {
    await MessageRequestModel.updateOne(
      { _id: new Types.ObjectId(requestId) },
      { $set: { status } },
    );
  }

  async countPending(recipientId: string): Promise<number> {
    return MessageRequestModel.countDocuments({
      recipientId: new Types.ObjectId(recipientId),
      status: EMessageRequestStatus.PENDING,
    });
  }

  async delete(requestId: string): Promise<void> {
    await MessageRequestModel.deleteOne({
      _id: new Types.ObjectId(requestId),
    });
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: Record<string, unknown>,
    EntityClass: new (
      props: IMessageRequestProps,
      id?: string,
    ) => MessageRequestEntity,
  ): MessageRequestEntity {
    if (!doc) throw new Error("Document not found");

    const {
      _id,
      __v,
      senderId,
      recipientId,
      conversationId,
      createdAt,
      updatedAt,
      ...rest
    } = doc as Record<string, any>;

    const props: IMessageRequestProps = {
      senderId: senderId.toString(),
      recipientId: recipientId.toString(),
      conversationId: conversationId.toString(),
      status: rest.status,
      message: rest.message ?? undefined,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }
}
