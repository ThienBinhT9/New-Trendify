import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) => (request: Request, _response: Response, next: NextFunction) => {
    request.body = schema.parse(request.body);
    next();
  };

export const validateParams =
  (schema: ZodSchema) => (request: Request, _response: Response, next: NextFunction) => {
    request.params = schema.parse(request.params) as any;
    next();
  };

export const validateQuery =
  (schema: ZodSchema) => (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request.query) as any;
    Object.keys(request.query).forEach((k) => delete (request.query as any)[k]);
    Object.assign(request.query, parsed);
    next();
  };
