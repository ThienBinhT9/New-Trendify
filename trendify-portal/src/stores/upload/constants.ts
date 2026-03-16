import { IApiResponse } from "@/interfaces/api.interface";
import { EMediaPurpose } from "@/interfaces/common.interface";

export enum EUploadActions {
  PRESIGNED = "PRESIGNED",
  CONFIRM_UPLOAD = "CONFIRM_UPLOAD",
}

export const UPLOAD_ENPOINT = {
  PRESIGNED: "/media/presigned",
  CONFIRM_UPLOAD: "/media/confirm",
};

//============= REQUEST =============
export interface IPresignedRequest {
  purpose: EMediaPurpose;
  filename: string;
  contentType: string;
  size: number;
}

export interface IConfirmUploadRequest {
  mediaId: string;
}

//============= RESPONSE =============
export interface IPresignedResponse extends IApiResponse {
  data: {
    uploadUrl: string;
    mediaId: string;
  };
}

export interface IConfirmUploadResponse extends IApiResponse {
  data: {
    id: string;
    url: string;
    status: string;
    purpose: EMediaPurpose;
    mimeType: string;
    size: number;
    variants: Array<{
      type: string;
      url: string;
      width: number;
      height: number;
    }>;
  };
}
