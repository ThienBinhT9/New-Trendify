import NotificationController from "@/interfaces/controllers/notification.controller";
import {
  GetNotificationsUseCase,
  GetUnreadNotificationCountUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from "@/application/usecases/notification";
import {
  MongooseMediaRepository,
  MongooseNotificationRepository,
  MongooseUserRepository,
} from "@/infrastructure/database/repositories";
import S3Service from "@/infrastructure/services/s3.service";

const notificationRepo = new MongooseNotificationRepository();
const userRepo = new MongooseUserRepository();
const mediaRepo = new MongooseMediaRepository();
const storageSvc = new S3Service();

const getNotificationsUseCase = new GetNotificationsUseCase(
  notificationRepo,
  userRepo,
  mediaRepo,
  storageSvc,
);
const getUnreadNotificationCountUseCase = new GetUnreadNotificationCountUseCase(notificationRepo);
const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepo);
const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepo);

const notificationController = new NotificationController(
  getNotificationsUseCase,
  getUnreadNotificationCountUseCase,
  markNotificationReadUseCase,
  markAllNotificationsReadUseCase,
);

export default notificationController;
