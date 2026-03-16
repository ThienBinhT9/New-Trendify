import {
  UPLOAD_ENPOINT,
  IPresignedRequest,
  IConfirmUploadRequest,
  IPresignedResponse,
  IConfirmUploadResponse,
} from "./constants";

import apiClient from "@/services/api-clients";

export const presigned = async (body: IPresignedRequest) => {
  return apiClient.post<IPresignedResponse>(UPLOAD_ENPOINT.PRESIGNED, body);
};

export const confirmUpload = async (body: IConfirmUploadRequest) => {
  return apiClient.post<IConfirmUploadResponse>(UPLOAD_ENPOINT.CONFIRM_UPLOAD, body);
};
