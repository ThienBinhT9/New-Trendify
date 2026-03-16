export interface ICacheService {
  get<T = string>(key: string): Promise<T | null>;

  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  del(key: string): Promise<void>;

  incr(key: string): Promise<number>;

  decr(key: string): Promise<number>;

  exists(key: string): Promise<boolean>;

  expire(key: string, ttlSeconds: number): Promise<void>;

  ttl(key: string): Promise<number | null>;

  zadd(key: string, score: number, member: string): Promise<void>;

  zremrangebyscore(key: string, min: number, max: number): Promise<void>;

  zcard(key: string): Promise<number>;

  delMany(keys: string[]): Promise<void>;

  delByPrefix(prefix: string): Promise<void>;

  // Set operations for unique tracking
  sadd(key: string, member: string, ttl?: number): Promise<number>;

  sismember(key: string, member: string): Promise<boolean>;

  // Get raw integer (for counters)
  getInt(key: string): Promise<number>;

  // Increment by N (default 1)
  incrBy(key: string, by?: number): Promise<number>;

  // Decrement by N (default 1), floor at 0
  decrBy(key: string, by?: number): Promise<number>;

  // Set only if key does not exist (for counter initialization)
  setNX(key: string, value: string | number): Promise<boolean>;

  // ===== HASH OPERATIONS =====
  // Get single hash field
  hGet(key: string, field: string): Promise<string | null>;

  // Get all hash fields
  hGetAll(key: string): Promise<Record<string, string>>;

  // Get multiple hash fields
  hMGet(key: string, fields: string[]): Promise<(string | null)[]>;

  // Set hash field
  hSet(key: string, field: string, value: string | number): Promise<void>;

  // Increment hash field by N
  hIncrBy(key: string, field: string, by?: number): Promise<number>;

  // Decrement hash field by N (floor at 0)
  hDecrBy(key: string, field: string, by?: number): Promise<number>;

  // Set hash field only if field doesn't exist
  hSetNX(key: string, field: string, value: string | number): Promise<boolean>;

  // Get and delete atomically
  getdel(key: string): Promise<string | null>;

  // Scan keys by pattern
  scanKeys(pattern: string): Promise<string[]>;
}
