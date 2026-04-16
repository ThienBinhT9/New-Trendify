import PresenceController from "@/interfaces/controllers/presence.controller";
import { RedisPresenceService } from "@/infrastructure/services/presence.service";
import { MongooseSettingsRepository } from "@/infrastructure/database/repositories";

// Infrastructure
const presenceService = new RedisPresenceService();
const settingsRepo = new MongooseSettingsRepository();

// Controller
const presenceController = new PresenceController(presenceService, settingsRepo);

export default presenceController;
