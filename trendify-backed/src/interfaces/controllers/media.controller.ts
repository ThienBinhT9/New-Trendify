import { Request, Response } from "express";
import {
  RequestPresignedUrlUseCase,
  ConfirmUploadUseCase,
  GetMediaStatusUseCase,
} from "@/application/usecases/media";

class MediaController {
  constructor(
    private readonly requestPresignedUrlUseCase: RequestPresignedUrlUseCase,
    private readonly confirmUploadUseCase: ConfirmUploadUseCase,
    private readonly getMediaStatusUseCase: GetMediaStatusUseCase,
  ) {}

  requestPresignedUrl = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const result = await this.requestPresignedUrlUseCase.execute({
      userId,
      ...request.body,
    });
    response.status(200).json(result);
  };

  confirmUpload = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { mediaId } = request.body;
    const result = await this.confirmUploadUseCase.execute({
      userId,
      mediaId,
    });
    response.status(200).json(result);
  };

  getMediaStatus = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { mediaId } = request.params;
    const result = await this.getMediaStatusUseCase.execute({
      userId,
      mediaId,
    });
    response.status(200).json(result);
  };
}

export default MediaController;
