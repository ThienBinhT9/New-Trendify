import { convertToCamelCase, convertToSnakeCase } from "@/shared/utils";
import { Request, Response, NextFunction } from "express";

export function convertRequestCase(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = convertToCamelCase(req.body);
  }

  if (req.query && typeof req.query === "object") {
    Object.assign(req.query, convertToCamelCase(req.query));
  }

  if (req.params && typeof req.params === "object") {
    Object.assign(req.params, convertToCamelCase(req.params));
  }

  next();
}
