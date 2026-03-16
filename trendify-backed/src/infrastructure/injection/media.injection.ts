import MediaController from "@/interfaces/controllers/media.controller";
import S3Service from "@/infrastructure/services/s3.service";
import { MongooseMediaRepository } from "@/infrastructure/database/repositories/media.repository.impl";
import { Producer } from "@/infrastructure/messaging/producer";
import {
  RequestPresignedUrlUseCase,
  ConfirmUploadUseCase,
  GetMediaStatusUseCase,
} from "@/application/usecases/media";

// Infrastructure
const mediaRepo = new MongooseMediaRepository();
const storageSvc = new S3Service();
const producer = new Producer();

// Use Cases
const requestPresignedUrlUseCase = new RequestPresignedUrlUseCase(mediaRepo, storageSvc);
const confirmUploadUseCase = new ConfirmUploadUseCase(mediaRepo, storageSvc, producer);
const getMediaStatusUseCase = new GetMediaStatusUseCase(mediaRepo, storageSvc);

// Controller
const mediaController = new MediaController(
  requestPresignedUrlUseCase,
  confirmUploadUseCase,
  getMediaStatusUseCase,
);

export default mediaController;

// Export for worker initialization
export { mediaRepo, storageSvc };
