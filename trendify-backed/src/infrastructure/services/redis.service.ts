import redisConfig from "@/infrastructure/configs/redis.config";
import { ICacheService } from "@/application/services/cache.service";
import Redis from "ioredis";

class RedisService implements ICacheService {
  private static instance: RedisService;
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      username: redisConfig.username,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      tls: redisConfig.tls,
      retryStrategy: redisConfig.reconnectStrategy,
    });

    this.client.on("connect", () => {
      console.log("✅ Redis Connected");
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis error", err);
    });
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, stringValue, "EX", ttl);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    const result = await this.client.decr(key);
    // Ensure non-negative
    if (result < 0) {
      await this.client.set(key, 0);
      return 0;
    }
    return result;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number | null> {
    return await this.client.ttl(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<void> {
    await this.client.zremrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return await this.client.zcard(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.client.del(...keys);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const fullPrefix = `${redisConfig.keyPrefix}${prefix}`;

    const stream = this.client.scanStream({
      match: `${fullPrefix}*`,
      count: 100,
    });

    const keys: string[] = [];

    for await (const batch of stream) {
      keys.push(...batch);
    }

    if (keys.length > 0) {
      const keysWithoutPrefix = keys.map((k) => k.slice(redisConfig.keyPrefix.length));
      await this.client.del(keysWithoutPrefix);
    }
  }

  // ====================== SET OPERATIONS ======================

  async sadd(key: string, member: string, ttl?: number): Promise<number> {
    const result = await this.client.sadd(key, member);
    // Set TTL only if this is a new key (first member added)
    if (ttl && result === 1) {
      const currentTtl = await this.client.ttl(key);
      if (currentTtl === -1) {
        // Key has no expiry, set it
        await this.client.expire(key, ttl);
      }
    }
    return result;
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return (await this.client.sismember(key, member)) === 1;
  }

  // ====================== COUNTER OPERATIONS ======================

  async getInt(key: string): Promise<number> {
    const raw = await this.client.get(key);
    if (!raw) return 0;
    return parseInt(raw, 10) || 0;
  }

  async incrBy(key: string, by: number = 1): Promise<number> {
    return await this.client.incrby(key, by);
  }

  async decrBy(key: string, by: number = 1): Promise<number> {
    const result = await this.client.decrby(key, by);
    if (result < 0) {
      await this.client.set(key, "0");
      return 0;
    }
    return result;
  }

  async setNX(key: string, value: string | number): Promise<boolean> {
    const result = await this.client.setnx(key, String(value));
    return result === 1;
  }

  // ====================== HASH OPERATIONS ======================

  async hGet(key: string, field: string): Promise<string | null> {
    return await this.client.hget(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async hMGet(key: string, fields: string[]): Promise<(string | null)[]> {
    return await this.client.hmget(key, ...fields);
  }

  async hSet(key: string, field: string, value: string | number): Promise<void> {
    await this.client.hset(key, field, String(value));
  }

  async hIncrBy(key: string, field: string, by: number = 1): Promise<number> {
    return await this.client.hincrby(key, field, by);
  }

  async hDecrBy(key: string, field: string, by: number = 1): Promise<number> {
    const result = await this.client.hincrby(key, field, -by);
    if (result < 0) {
      await this.client.hset(key, field, "0");
      return 0;
    }
    return result;
  }

  async hSetNX(key: string, field: string, value: string | number): Promise<boolean> {
    const result = await this.client.hsetnx(key, field, String(value));
    return result === 1;
  }

  async getdel(key: string): Promise<string | null> {
    // GETDEL is Redis 6.2+, fallback for older versions
    const value = await this.client.get(key);
    if (value !== null) {
      await this.client.del(key);
    }
    return value;
  }

  // ====================== SCAN OPERATIONS ======================

  async scanKeys(pattern: string): Promise<string[]> {
    const stream = this.client.scanStream({
      match: pattern,
      count: 100,
    });

    const keys: string[] = [];

    for await (const batch of stream) {
      keys.push(...batch);
    }

    return keys;
  }
}

export default RedisService;
