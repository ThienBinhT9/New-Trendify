import { Types, ClientSession } from "mongoose";

import {
  IConversationRepository,
  ConversationEntity,
  IConversationProps,
  IConversationMember,
  IConversationSettings,
  ILastMessageSnapshot,
  EConversationRole,
  EConversationType,
} from "@/domain/chat";
import { ConversationModel } from "../models/conversation.model";
import { BaseRepository } from "./base.repository";

export class MongooseConversationRepository
  extends BaseRepository<ConversationEntity, IConversationProps>
  implements IConversationRepository
{
  constructor(private readonly session?: ClientSession) {
    super();
  }

  async create(entity: ConversationEntity): Promise<ConversationEntity> {
    const data = entity.data;

    const doc = await ConversationModel.create(
      [
        {
          type: data.type,
          members: data.members.map((m) => ({
            userId: new Types.ObjectId(m.userId),
            role: m.role,
            joinedAt: m.joinedAt,
            lastReadMessageId: m.lastReadMessageId ? new Types.ObjectId(m.lastReadMessageId) : null,
            lastReadAt: m.lastReadAt ?? null,
            mutedUntil: m.mutedUntil ?? null,
            isArchived: m.isArchived,
            isPinned: m.isPinned,
          })),
          name: data.name ?? null,
          avatarMediaId: data.avatarMediaId ? new Types.ObjectId(data.avatarMediaId) : null,
          createdBy: new Types.ObjectId(data.createdBy),
          pinnedMessageIds: [],
          isDeleted: false,
        },
      ],
      { session: this.session },
    );

    return this.mapToEntity(doc[0].toObject() as Record<string, any>, ConversationEntity);
  }

  async findById(id: string): Promise<ConversationEntity | null> {
    const doc = await ConversationModel.findById(id).lean();
    if (!doc) return null;
    return this.mapToEntity(doc, ConversationEntity);
  }

  async findDirectConversation(
    userIdA: string,
    userIdB: string,
  ): Promise<ConversationEntity | null> {
    const doc = await ConversationModel.findOne({
      type: EConversationType.DIRECT,
      "members.userId": {
        $all: [new Types.ObjectId(userIdA), new Types.ObjectId(userIdB)],
      },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    }).lean();

    if (!doc) return null;
    return this.mapToEntity(doc, ConversationEntity);
  }

  async findByMember(
    userId: string,
    options: {
      limit: number;
      cursor?: string;
      isArchived?: boolean;
      isPinned?: boolean;
    },
  ): Promise<{ conversations: ConversationEntity[]; nextCursor?: string }> {
    const userOid = new Types.ObjectId(userId);

    const matchStage: Record<string, unknown> = {
      "members.userId": userOid,
      isDeleted: false,
    };

    // Use aggregation to filter by member-specific settings
    const pipeline: any[] = [];

    // First match: conversations the user is a member of
    pipeline.push({ $match: matchStage });

    // Project the member's settings for filtering
    pipeline.push({
      $addFields: {
        currentMember: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$members",
                cond: { $eq: ["$$this.userId", userOid] },
              },
            },
            0,
          ],
        },
      },
    });

    // Filter by archive/pin status
    const memberFilter: Record<string, unknown> = {};
    if (typeof options.isArchived === "boolean") {
      memberFilter["currentMember.isArchived"] = options.isArchived;
    }
    if (typeof options.isPinned === "boolean") {
      memberFilter["currentMember.isPinned"] = options.isPinned;
    }
    if (Object.keys(memberFilter).length > 0) {
      pipeline.push({ $match: memberFilter });
    }

    // Cursor pagination
    if (options.cursor) {
      pipeline.push({
        $match: { _id: { $lt: new Types.ObjectId(options.cursor) } },
      });
    }

    // Sort by last activity (lastMessage.createdAt) then by _id
    pipeline.push({
      $sort: { "lastMessage.createdAt": -1, _id: -1 },
    });

    // Fetch limit + 1 for hasNext check
    pipeline.push({ $limit: options.limit + 1 });

    // Remove temp field
    pipeline.push({ $project: { currentMember: 0 } });

    const docs = await ConversationModel.aggregate(pipeline);

    const hasNext = docs.length > options.limit;
    const sliced = hasNext ? docs.slice(0, options.limit) : docs;

    return {
      conversations: sliced.map((doc) => this.mapToEntity(doc, ConversationEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async updateLastMessage(
    conversationId: string,
    lastMessage: ILastMessageSnapshot,
  ): Promise<void> {
    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $set: {
          lastMessage: {
            messageId: new Types.ObjectId(lastMessage.messageId),
            senderId: new Types.ObjectId(lastMessage.senderId),
            content: lastMessage.content,
            type: lastMessage.type,
            createdAt: lastMessage.createdAt,
          },
        },
      },
    );
  }

  async addMember(conversationId: string, member: IConversationMember): Promise<void> {
    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $push: {
          members: {
            userId: new Types.ObjectId(member.userId),
            role: member.role,
            joinedAt: member.joinedAt,
            isArchived: false,
            isPinned: false,
          },
        },
      },
    );
  }

  async removeMember(conversationId: string, userId: string): Promise<void> {
    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $pull: { members: { userId: new Types.ObjectId(userId) } },
      },
    );
  }

  async updateMemberRole(
    conversationId: string,
    userId: string,
    role: EConversationRole,
  ): Promise<void> {
    await ConversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        "members.userId": new Types.ObjectId(userId),
      },
      { $set: { "members.$.role": role } },
    );
  }

  async updateMemberSettings(
    conversationId: string,
    userId: string,
    settings: Partial<
      Pick<
        IConversationMember,
        "mutedUntil" | "isArchived" | "isPinned" | "lastReadMessageId" | "lastReadAt"
      >
    >,
  ): Promise<void> {
    const $set: Record<string, unknown> = {};

    if (settings.mutedUntil !== undefined) {
      $set["members.$.mutedUntil"] = settings.mutedUntil;
    }
    if (settings.isArchived !== undefined) {
      $set["members.$.isArchived"] = settings.isArchived;
    }
    if (settings.isPinned !== undefined) {
      $set["members.$.isPinned"] = settings.isPinned;
    }
    if (settings.lastReadMessageId !== undefined) {
      $set["members.$.lastReadMessageId"] = new Types.ObjectId(settings.lastReadMessageId);
    }
    if (settings.lastReadAt !== undefined) {
      $set["members.$.lastReadAt"] = settings.lastReadAt;
    }

    if (Object.keys($set).length === 0) return;

    await ConversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        "members.userId": new Types.ObjectId(userId),
      },
      { $set },
    );
  }

  async pinMessage(conversationId: string, messageId: string): Promise<void> {
    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { $addToSet: { pinnedMessageIds: new Types.ObjectId(messageId) } },
    );
  }

  async unpinMessage(conversationId: string, messageId: string): Promise<void> {
    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { $pull: { pinnedMessageIds: new Types.ObjectId(messageId) } },
    );
  }

  async updateGroupInfo(
    conversationId: string,
    updates: { name?: string; avatarMediaId?: string },
  ): Promise<void> {
    const $set: Record<string, unknown> = {};
    if (updates.name !== undefined) $set.name = updates.name;
    if (updates.avatarMediaId !== undefined) {
      $set.avatarMediaId = new Types.ObjectId(updates.avatarMediaId);
    }

    if (Object.keys($set).length === 0) return;

    await ConversationModel.updateOne({ _id: new Types.ObjectId(conversationId) }, { $set });
  }

  async updateSettings(
    conversationId: string,
    settings: Partial<IConversationSettings>,
  ): Promise<void> {
    const $set: Record<string, unknown> = {};

    if (settings.themeId !== undefined) {
      $set["settings.themeId"] = settings.themeId;
    }
    if (settings.quickEmoji !== undefined) {
      $set["settings.quickEmoji"] = settings.quickEmoji;
    }
    if (settings.nicknames) {
      for (const [userId, nickname] of Object.entries(settings.nicknames)) {
        $set[`settings.nicknames.${userId}`] = nickname;
      }
    }

    if (Object.keys($set).length === 0) return;

    await ConversationModel.updateOne({ _id: new Types.ObjectId(conversationId) }, { $set });
  }

  async countUnreadConversations(userId: string): Promise<number> {
    const userOid = new Types.ObjectId(userId);

    const result = await ConversationModel.aggregate([
      {
        $match: {
          "members.userId": userOid,
          isDeleted: false,
          "lastMessage.messageId": { $exists: true },
        },
      },
      {
        $addFields: {
          currentMember: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$members",
                  cond: { $eq: ["$$this.userId", userOid] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$currentMember.lastReadMessageId", null] },
              {
                $gt: ["$lastMessage.messageId", "$currentMember.lastReadMessageId"],
              },
            ],
          },
        },
      },
      { $count: "total" },
    ]);

    return result[0]?.total ?? 0;
  }

  async findConversationIdsByMember(userId: string): Promise<string[]> {
    const docs = await ConversationModel.find(
      {
        "members.userId": new Types.ObjectId(userId),
        isDeleted: false,
      },
      { _id: 1 },
    ).lean();

    return docs.map((doc) => doc._id.toString());
  }

  async deleteById(conversationId: string): Promise<void> {
    await ConversationModel.deleteOne({ _id: new Types.ObjectId(conversationId) });
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: Record<string, unknown>,
    EntityClass: new (props: IConversationProps, id?: string) => ConversationEntity,
  ): ConversationEntity {
    if (!doc) throw new Error("Document not found");

    const {
      _id,
      __v,
      type,
      name,
      members,
      createdBy,
      lastMessage,
      pinnedMessageIds,
      avatarMediaId,
      settings,
      isDeleted,
      createdAt,
      updatedAt,
    } = doc as Record<string, any>;

    const props: IConversationProps = {
      type: type as EConversationType,
      name: name,
      members: Array.isArray(members)
        ? members.map((m: Record<string, any>) => ({
            userId: m.userId.toString(),
            role: m.role as EConversationRole,
            joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
            lastReadMessageId: m.lastReadMessageId?.toString() ?? undefined,
            lastReadAt: m.lastReadAt ? new Date(m.lastReadAt) : undefined,
            mutedUntil: m.mutedUntil ? new Date(m.mutedUntil) : null,
            isArchived: m.isArchived ?? false,
            isPinned: m.isPinned ?? false,
          }))
        : [],
      createdBy: createdBy.toString(),
      lastMessage: lastMessage
        ? {
            messageId: lastMessage.messageId.toString(),
            senderId: lastMessage.senderId.toString(),
            content: lastMessage.content ?? "",
            type: lastMessage.type,
            createdAt: new Date(lastMessage.createdAt),
          }
        : undefined,
      pinnedMessageIds: Array.isArray(pinnedMessageIds)
        ? pinnedMessageIds.map((id: Types.ObjectId) => id.toString())
        : [],
      avatarMediaId: avatarMediaId?.toString() ?? undefined,
      settings: settings
        ? {
            themeId: settings.themeId,
            quickEmoji: settings.quickEmoji,
            nicknames: settings.nicknames instanceof Map 
              ? Object.fromEntries(settings.nicknames)
              : (settings.nicknames ?? {}),
          }
        : undefined,
      isDeleted: isDeleted ?? false,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }
}
