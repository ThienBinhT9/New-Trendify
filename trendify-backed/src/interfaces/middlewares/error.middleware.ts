import {
  BadRequestError,
  ErrorResponse,
  InternalServerError,
  NotFoundError,
} from "@/shared/responses";
import { Response, Request, NextFunction } from "express";
import { ZodError } from "zod";

interface HttpError extends Error {
  status?: number;
}

export const notfound = (request: Request, response: Response, next: NextFunction) => {
  next(new NotFoundError());
};

export const error = (
  error: HttpError | ZodError,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  if (error instanceof ZodError) {
    const issues = error.issues;
    const message = issues[0].message;
    const badRequest = new BadRequestError(message);

    response.status(badRequest.statusCode).json(badRequest.toJSON());
    return;
  }

  if (error instanceof ErrorResponse) {
    return response.status(error.statusCode).json(error.toJSON());
  }

  const serverError = new InternalServerError(error.message || "Something went wrong");
  response.status(serverError.statusCode).json(serverError.toJSON());

  return;
};
