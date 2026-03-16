export abstract class BaseResponse {
  abstract readonly success: boolean;
  abstract readonly statusCode: number;
  abstract readonly message: string;
  abstract readonly data?: any;

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }
}

export class SuccessResponse<T = any> extends BaseResponse {
  readonly success = true;
  readonly statusCode: number;
  readonly message: string;
  readonly data?: T;

  constructor(params: { data?: T; message?: string; statusCode?: number }) {
    super();
    this.statusCode = params.statusCode || 200;
    this.message = params.message || "Success";
    this.data = params.data;
  }
}

export class ErrorResponse extends Error {
  readonly success = false;
  readonly statusCode: number;
  readonly data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(message: string = "Bad Request", data?: any) {
    super(message, 400, data);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(message: string = "Unauthorized", data?: any) {
    super(message, 401, data);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(message: string = "Forbidden", data?: any) {
    super(message, 403, data);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(message: string = "Not Found", data?: any) {
    super(message, 404, data);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ErrorResponse {
  constructor(message: string = "Conflict", data?: any) {
    super(message, 409, data);
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends ErrorResponse {
  constructor(message: string = "Too Many Requests", data?: any) {
    super(message, 429, data);
    this.name = "TooManyRequestsError";
  }
}

export class InternalServerError extends ErrorResponse {
  constructor(message: string = "Internal Server Error", data?: any) {
    super(message, 500, data);
    this.name = "InternalServerError";
  }
}
