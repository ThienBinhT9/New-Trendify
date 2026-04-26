"""
Redis async service for caching recommendation results.
Connects to the same Redis instance as the Node.js backend.
"""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis
from app.config import get_settings


class RedisService:
    _instance: "RedisService | None" = None
    _client: aioredis.Redis | None = None

    @classmethod
    def get_instance(cls) -> "RedisService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def connect(self) -> None:
        if self._client is not None:
            return

        settings = get_settings()

        if settings.redis_url:
            # URL-based connection (Upstash, cloud Redis with TLS)
            self._client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
            )
        else:
            # Host/port connection (local Redis)
            self._client = aioredis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=True,
            )

        # Verify connection
        await self._client.ping()
        self._prefix = settings.redis_key_prefix
        redis_target = settings.redis_url or f"{settings.redis_host}:{settings.redis_port}"
        print(f"✅ AI Service connected to Redis: {redis_target[:50]}...")

    async def disconnect(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None
            print("🔌 AI Service disconnected from Redis")

    def _key(self, key: str) -> str:
        """Add prefix to match Node.js Redis key pattern."""
        return f"{self._prefix}{key}"

    # ==================== BASIC OPERATIONS ====================

    async def get(self, key: str) -> Any | None:
        if not self._client:
            return None
        raw = await self._client.get(self._key(key))
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return raw

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        if not self._client:
            return
        serialized = json.dumps(value, default=str)
        if ttl:
            await self._client.set(self._key(key), serialized, ex=ttl)
        else:
            await self._client.set(self._key(key), serialized)

    async def delete(self, key: str) -> None:
        if not self._client:
            return
        await self._client.delete(self._key(key))

    # ==================== SET OPERATIONS ====================

    async def sadd(self, key: str, *members: str) -> int:
        if not self._client:
            return 0
        return await self._client.sadd(self._key(key), *members)

    async def sismember(self, key: str, member: str) -> bool:
        if not self._client:
            return False
        return await self._client.sismember(self._key(key), member)

    async def smembers(self, key: str) -> set[str]:
        if not self._client:
            return set()
        return await self._client.smembers(self._key(key))

    async def expire(self, key: str, ttl: int) -> None:
        if not self._client:
            return
        await self._client.expire(self._key(key), ttl)
