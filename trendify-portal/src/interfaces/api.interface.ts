export interface IApiException {
  message: string;
  status: number;
}

export interface IApiError {
  message: string;
  statusCode: number;
  success: boolean;
}

export interface IApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
}
