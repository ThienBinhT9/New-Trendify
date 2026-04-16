import { Router } from "express";
import chatController from "@/infrastructure/injection/chat.injection";
import { authMiddleware } from "@/interfaces/middlewares/auth.middleware";

const route = Router();

route.use(authMiddleware());

// ========== CONVERSATIONS ==========

// GET /api/chat/conversations
route.get("/conversations", chatController.getConversations);

// POST /api/chat/conversations (Create DM)
route.post("/conversations", chatController.createDM);

// POST /api/chat/conversations/group (Create Group)
route.post("/conversations/group", chatController.createGroup);

// PATCH /api/chat/conversations/:conversationId (Update Group Info)
route.patch("/conversations/:conversationId", chatController.updateGroup);

// DELETE /api/chat/conversations/:conversationId
route.delete("/conversations/:conversationId", chatController.deleteConversation);

// POST /api/chat/conversations/:conversationId/pin (Pin/Unpin Conversation)
route.post("/conversations/:conversationId/pin", chatController.pinConversation);

// ========== GROUP MEMBERS ==========

// POST /api/chat/conversations/:conversationId/members (Add Member)
route.post("/conversations/:conversationId/members", chatController.addMember);

// DELETE /api/chat/conversations/:conversationId/members/:userId (Remove Member)
route.delete("/conversations/:conversationId/members/:userId", chatController.removeMember);

// POST /api/chat/conversations/:conversationId/leave (Leave Group)
route.post("/conversations/:conversationId/leave", chatController.leaveGroup);

// GET /api/chat/conversations/:conversationId/members (Get Members)
route.get("/conversations/:conversationId/members", chatController.getMembers);


// ========== MESSAGES ==========

// GET /api/chat/conversations/:conversationId/messages
route.get("/conversations/:conversationId/messages", chatController.getMessages);

// POST /api/chat/conversations/:conversationId/messages
route.post("/conversations/:conversationId/messages", chatController.sendMessage);

// ========== REACTIONS ==========

// POST /api/chat/conversations/:conversationId/messages/:messageId/reactions
route.post(
  "/conversations/:conversationId/messages/:messageId/reactions",
  chatController.toggleReaction,
);

// ========== SETTINGS ==========

// PATCH /api/chat/conversations/:conversationId/settings
route.patch("/conversations/:conversationId/settings", chatController.updateSettings);

// GET /api/chat/conversations/:conversationId/media
route.get("/conversations/:conversationId/media", chatController.getConversationMedia);

export default route;
