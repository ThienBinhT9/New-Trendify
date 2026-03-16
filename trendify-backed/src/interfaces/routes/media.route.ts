import { Router } from "express";
import mediaController from "@/infrastructure/injection/media.injection";
import { authMiddleware } from "@/interfaces/middlewares/auth.middleware";
import { validate, validateParams } from "../middlewares/validate.middleware";
import * as schema from "../validators/media.validator";
import { MEDIA_ROUTES } from "@/shared/constants/router.constant";

const route = Router();
route.use(authMiddleware());

// POST /api/media/presigned-url — Request a presigned upload URL
route.post(
  MEDIA_ROUTES.PRESIGNED_URL,
  validate(schema.requestPresignedUrlSchema),
  mediaController.requestPresignedUrl,
);

// POST /api/media/confirm — Confirm file upload completed
route.post(
  MEDIA_ROUTES.CONFIRM_UPLOAD,
  validate(schema.confirmUploadSchema),
  mediaController.confirmUpload,
);

// GET /api/media/:mediaId/status — Check media processing status
route.get(
  MEDIA_ROUTES.STATUS,
  validateParams(schema.getMediaStatusParamsSchema),
  mediaController.getMediaStatus,
);

export default route;
