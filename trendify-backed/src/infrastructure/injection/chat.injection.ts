import ChatController from "@/interfaces/controllers/chat.controller";
import { MongooseConversationRepository } from "@/infrastructure/database/repositories/conversation.repository.impl";
import { MongooseUserRepository, MongooseBlockRepository } from "@/infrastructure/database/repositories";
import { MongooseMediaRepository } from "@/infrastructure/database/repositories/media.repository.impl";
import S3Service from "@/infrastructure/services/s3.service";
import { MongooseMessageRepository } from "@/infrastructure/database/repositories/message.repository.impl";
import { GetConversationsUseCase } from "@/application/usecases/chat/get-conversations.usecase";
import { CreateDMUseCase } from "@/application/usecases/chat/create-dm.usecase";
import { CreateGroupUseCase } from "@/application/usecases/chat/create-group.usecase";
import { ManageGroupUseCase } from "@/application/usecases/chat/manage-group.usecase";
import { GetMessagesUseCase } from "@/application/usecases/chat/get-messages.usecase";
import { SendMessageUseCase } from "@/application/usecases/chat/send-message.usecase";
import { DeleteConversationUseCase } from "@/application/usecases/chat/delete-conversation.usecase";
import { ToggleReactionUseCase } from "@/application/usecases/chat/toggle-reaction.usecase";
import { UpdateConversationSettingsUseCase } from "@/application/usecases/chat/update-conversation-settings.usecase";
import { PinConversationUseCase } from "@/application/usecases/chat/pin-conversation.usecase";
import { GetConversationMediaUseCase } from "@/application/usecases/chat/get-conversation-media.usecase";

// Infrastructure
const conversationRepo = new MongooseConversationRepository();
const userRepo = new MongooseUserRepository();
const messageRepo = new MongooseMessageRepository();
const blockRepo = new MongooseBlockRepository();
const mediaRepo = new MongooseMediaRepository();
const storageSvc = new S3Service();

// Use Cases
const getConversationsUseCase = new GetConversationsUseCase(conversationRepo, userRepo, mediaRepo, storageSvc);
const createDMUseCase = new CreateDMUseCase(conversationRepo, userRepo);
const createGroupUseCase = new CreateGroupUseCase(conversationRepo, userRepo);
const manageGroupUseCase = new ManageGroupUseCase(conversationRepo, userRepo, mediaRepo, storageSvc);
const getMessagesUseCase = new GetMessagesUseCase(messageRepo, conversationRepo, userRepo, mediaRepo, storageSvc);
const sendMessageUseCase = new SendMessageUseCase(messageRepo, conversationRepo, blockRepo, mediaRepo, storageSvc);
const deleteConversationUseCase = new DeleteConversationUseCase(conversationRepo, messageRepo);
const toggleReactionUseCase = new ToggleReactionUseCase(messageRepo, conversationRepo);
const updateConversationSettingsUseCase = new UpdateConversationSettingsUseCase(conversationRepo);
const pinConversationUseCase = new PinConversationUseCase();
const getConversationMediaUseCase = new GetConversationMediaUseCase(conversationRepo, mediaRepo, storageSvc);

// Controller
const chatController = new ChatController(
  getConversationsUseCase,
  createDMUseCase,
  createGroupUseCase,
  manageGroupUseCase,
  getMessagesUseCase,
  sendMessageUseCase,
  deleteConversationUseCase,
  toggleReactionUseCase,
  updateConversationSettingsUseCase,
  pinConversationUseCase,
  getConversationMediaUseCase,
);

export default chatController;
