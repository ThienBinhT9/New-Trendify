// import { NextFunction, Request, Response } from "express";

// import ratelimitConfig from "@/config/ratelimit.config";
// import RateLimitService from "@/application/usecases/ratelimit.usecase";
// import RedisService from "@/infrastructure/services/redis.service";

// const redis = RedisService.getInstance();
// const rateLimitService = new RateLimitService(redis);

// export const ratelimit = (configKey: keyof typeof ratelimitConfig = "default") => {
//   return async (request: Request, response: Response, next: NextFunction) => {
//     const config = ratelimitConfig[configKey];
//     const userId = request.headers.userid?.toString();
//     const redisKey = `rate:${userId}:${request.path}`;

//     const result = await rateLimitService.checkLimit(redisKey, config.limit, config.ttlSeconds);

//     response.setHeader("X-RateLimit-Limit", config.limit);
//     response.setHeader("X-RateLimit-Remaining", result.remaining);
//     response.setHeader("X-RateLimit-Reset", result.resetIn);

//     if (!result.allowed) {
//       return response.status(429).json({
//         message: "Too many requests. Please try again later.",
//         resetIn: result.resetIn,
//       });
//     }

//     next();
//   };
// };
