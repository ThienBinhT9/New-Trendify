import { JwtPayloadBase } from "@/application/services/jwt.service";
import appConfig from "@/config/app.config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = () => {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Missing access token" });
      }

      const token = authHeader.split(" ")[1];

      const payload = jwt.verify(token, appConfig.accessTokenSecret) as JwtPayloadBase;

      // attach user context
      response.locals.auth = { userId: payload.sub };

      return next();
    } catch (error) {
      return response.status(401).json({ status: 401, message: "Invalid or expired token" });
    }
  };
};
