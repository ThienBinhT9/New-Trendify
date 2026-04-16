import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { IChatState, IConversation, IMessage, IMessagesData } from "./constants";
import * as actions from "./actions";

const initialMessagesData: IMessagesData = {
  items: [],
  cursor: null,
  hasNext: false,
  loading: false,
};

const initialState: IChatState = {
  conversations: {
    items: [],
    cursor: null,
    hasNext: false,
    loading: false,
  },
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  unreadTotalCount: 0,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },

    /**
     * Realtime: new message received via Socket.IO
     */
    addRealtimeMessage: (state, action: PayloadAction<IMessage>) => {
      const msg = action.payload;
      const convId = msg.conversationId;

      // Add to messages list
      if (!state.messages[convId]) {
        state.messages[convId] = { ...initialMessagesData };
      }

      // Prevent duplicate
      const exists = state.messages[convId].items.some((m) => m.id === msg.id);
      if (!exists) {
        state.messages[convId].items.unshift(msg);
      }

      // Update conversation's last message + move to top
      const convIndex = state.conversations.items.findIndex((c) => c.id === convId);
      if (convIndex >= 0) {
        const conv = state.conversations.items[convIndex];
        conv.lastMessage = {
          messageId: msg.id,
          senderId: msg.senderId,
          content: msg.content ?? "",
          type: msg.type,
          createdAt: msg.createdAt,
        };

        // Move conversation to top
        state.conversations.items.splice(convIndex, 1);
        state.conversations.items.unshift(conv);
      }
    },

    /**
     * Realtime: typing indicator
     */
    setTypingUsers: (
      state,
      action: PayloadAction<{ conversationId: string; userIds: string[] }>,
    ) => {
      state.typingUsers[action.payload.conversationId] = action.payload.userIds;
    },

    /**
     * Update unread count for a conversation
     */
    setConversationUnread: (
      state,
      action: PayloadAction<{ conversationId: string; count: number }>,
    ) => {
      const conv = state.conversations.items.find((c) => c.id === action.payload.conversationId);
      if (conv) {
        conv.unreadCount = action.payload.count;
      }
    },

    /**
     * Mark conversation messages as read locally
     */
    markConversationReadLocal: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.items.find((c) => c.id === action.payload);
      if (conv) {
        conv.unreadCount = 0;
      }
    },

    /**
     * Realtime: message unsent
     */
    markMessageUnsent: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string }>,
    ) => {
      const msgs = state.messages[action.payload.conversationId];
      if (msgs) {
        const msg = msgs.items.find((m) => m.id === action.payload.messageId);
        if (msg) {
          msg.isUnsent = true;
          msg.content = undefined;
        }
      }
    },

    /**
     * Add a new conversation (when creating a new DM/group)
     */
    addConversation: (state, action: PayloadAction<IConversation>) => {
      const exists = state.conversations.items.some((c) => c.id === action.payload.id);
      if (!exists) {
        state.conversations.items.unshift(action.payload);
      }
    },
  },
  extraReducers(builder) {
    // ===== Get Conversations =====
    builder
      .addCase(actions.getConversationsAction.pending, (state) => {
        state.conversations.loading = true;
      })
      .addCase(actions.getConversationsAction.fulfilled, (state, action) => {
        const { items, cursor, hasNext } = action.payload;
        const isFirstPage = !action.meta.arg?.cursor;

        if (isFirstPage) {
          state.conversations.items = items;
        } else {
          state.conversations.items = [...state.conversations.items, ...items];
        }

        state.conversations.cursor = cursor;
        state.conversations.hasNext = hasNext;
        state.conversations.loading = false;
      })
      .addCase(actions.getConversationsAction.rejected, (state) => {
        state.conversations.loading = false;
      });

    // ===== Get Messages =====
    builder
      .addCase(actions.getMessagesAction.pending, (state, action) => {
        const convId = action.meta.arg.conversationId;
        if (!state.messages[convId]) {
          state.messages[convId] = { ...initialMessagesData };
        }
        state.messages[convId].loading = true;
      })
      .addCase(actions.getMessagesAction.fulfilled, (state, action) => {
        const { conversationId, items, cursor, hasNext } = action.payload;
        const isFirstPage = !action.meta.arg.cursor;

        if (!state.messages[conversationId]) {
          state.messages[conversationId] = { ...initialMessagesData };
        }

        if (isFirstPage) {
          state.messages[conversationId].items = items;
        } else {
          // Append older messages (cursor-based, newest first)
          state.messages[conversationId].items = [
            ...state.messages[conversationId].items,
            ...items,
          ];
        }

        state.messages[conversationId].cursor = cursor;
        state.messages[conversationId].hasNext = hasNext;
        state.messages[conversationId].loading = false;
      })
      .addCase(actions.getMessagesAction.rejected, (state, action) => {
        const convId = action.meta.arg.conversationId;
        if (state.messages[convId]) {
          state.messages[convId].loading = false;
        }
      });

    // ===== Send Message =====
    builder.addCase(actions.sendMessageAction.fulfilled, (state, action) => {
      const msg = action.payload;
      const convId = msg.conversationId;

      if (!state.messages[convId]) {
        state.messages[convId] = { ...initialMessagesData };
      }

      // Add sent message to top (newest first)
      const exists = state.messages[convId].items.some((m) => m.id === msg.id);
      if (!exists) {
        state.messages[convId].items.unshift(msg);
      }

      // Update conversation's last message
      const conv = state.conversations.items.find((c) => c.id === convId);
      if (conv) {
        conv.lastMessage = {
          messageId: msg.id,
          senderId: msg.senderId,
          content: msg.content ?? "",
          type: msg.type,
          createdAt: msg.createdAt,
        };

        // Move to top
        const idx = state.conversations.items.indexOf(conv);
        if (idx > 0) {
          state.conversations.items.splice(idx, 1);
          state.conversations.items.unshift(conv);
        }
      }
    });
  },
});

export const {
  setActiveConversation,
  addRealtimeMessage,
  setTypingUsers,
  setConversationUnread,
  markConversationReadLocal,
  markMessageUnsent,
  addConversation,
} = chatSlice.actions;

export default chatSlice;
