import dotenv from "dotenv";
dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USER || undefined, // Redis 6+ có ACL
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0, // chọn database index
  tls: process.env.REDIS_TLS === "true" ? {} : undefined, // TLS cho cloud Redis (vd: AWS Elasticache, Upstash)
  keyPrefix: process.env.REDIS_KEY_PREFIX || "myapp:", // prefix để tránh key collision
  reconnectStrategy: (times: number) => {
    // tăng dần thời gian reconnect, tối đa 2s
    return Math.min(times * 50, 2000);
  },
};

export default redisConfig;
