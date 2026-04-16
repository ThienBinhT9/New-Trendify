import apiClient from "@/services/api-clients";

import {
  CHAT_ENDPOINT,
  IConversationListResponse,
  ICreateDMResponse,
  ICreateGroupResponse,
  ICreateGroupParams,
  IGetConversationsParams,
  IGetMessagesParams,
  IMessageListResponse,
  ISendMessageParams,
  ISendMessageResponse,
} from "./constants";

export const getConversations = async (params?: IGetConversationsParams) => {
  return apiClient.get<IConversationListResponse>(CHAT_ENDPOINT.CONVERSATIONS, { params });
};

export const getMessages = async (conversationId: string, params?: IGetMessagesParams) => {
  return apiClient.get<IMessageListResponse>(CHAT_ENDPOINT.MESSAGES(conversationId), { params });
};

export const sendMessage = async (data: ISendMessageParams) => {
  const { conversationId, ...body } = data;
  return apiClient.post<ISendMessageResponse>(CHAT_ENDPOINT.SEND_MESSAGE(conversationId), body);
};

export const createDM = async (participantId: string) => {
  return apiClient.post<ICreateDMResponse>(CHAT_ENDPOINT.CREATE_DM, {
    type: "direct",
    participantId,
  });
};

export const markConversationRead = async (conversationId: string, messageId: string) => {
  return apiClient.put(CHAT_ENDPOINT.MARK_READ(conversationId), { messageId });
};

export const pinConversation = async (conversationId: string) => {
  return apiClient.post(CHAT_ENDPOINT.PIN_CONVERSATION(conversationId));
};

export const deleteConversation = async (conversationId: string) => {
  return apiClient.delete(CHAT_ENDPOINT.DELETE_CONVERSATION(conversationId));
};

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export const createGroup = async (data: ICreateGroupParams) => {
  return apiClient.post<ICreateGroupResponse>(CHAT_ENDPOINT.CREATE_GROUP, data);
};

export const addMember = async (conversationId: string, userId: string) => {
  return apiClient.post(CHAT_ENDPOINT.ADD_MEMBER(conversationId), { userId });
};

export const removeMember = async (conversationId: string, userId: string) => {
  return apiClient.delete(CHAT_ENDPOINT.REMOVE_MEMBER(conversationId, userId));
};

export const leaveGroup = async (conversationId: string) => {
  return apiClient.post(CHAT_ENDPOINT.LEAVE_GROUP(conversationId));
};

export const getGroupMembers = async (conversationId: string) => {
  return apiClient.get(CHAT_ENDPOINT.GET_MEMBERS(conversationId));
};

export const promoteMember = async (conversationId: string, userId: string) => {
  return apiClient.post(CHAT_ENDPOINT.PROMOTE_MEMBER(conversationId, userId));
};

export const demoteMember = async (conversationId: string, userId: string) => {
  return apiClient.post(CHAT_ENDPOINT.DEMOTE_MEMBER(conversationId, userId));
};

export const updateGroup = async (
  conversationId: string,
  data: { name?: string; avatarMediaId?: string },
) => {
  return apiClient.patch(CHAT_ENDPOINT.UPDATE_GROUP(conversationId), data);
};

export const getConversationMedia = async (
  conversationId: string,
  params?: { type?: "image" | "video" | "file" | "all"; limit?: number; cursor?: string },
) => {
  return apiClient.get(CHAT_ENDPOINT.CONVERSATION_MEDIA(conversationId), { params });
};
