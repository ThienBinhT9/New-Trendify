"""
MongoDB async service using Motor.
Connects to the same MongoDB instance as the Node.js backend.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings


class MongoService:
    _instance: "MongoService | None" = None
    _client: AsyncIOMotorClient | None = None
    _db: AsyncIOMotorDatabase | None = None

    @classmethod
    def get_instance(cls) -> "MongoService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def connect(self) -> None:
        if self._client is not None:
            return

        settings = get_settings()
        self._client = AsyncIOMotorClient(
            settings.mongo_uri,
            maxPoolSize=50,
            serverSelectionTimeoutMS=5000,
        )
        self._db = self._client.get_default_database()

        # Verify connection
        await self._client.admin.command("ping")
        print(f"✅ AI Service connected to MongoDB: {settings.mongo_uri}")

    async def disconnect(self) -> None:
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            print("🔌 AI Service disconnected from MongoDB")

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("MongoDB not connected. Call connect() first.")
        return self._db

    # ==================== COLLECTION SHORTCUTS ====================

    @property
    def users(self):
        return self.db["users"]

    @property
    def follows(self):
        return self.db["follows"]

    @property
    def posts(self):
        return self.db["posts"]

    @property
    def likes(self):
        return self.db["likes"]

    @property
    def comments(self):
        return self.db["comments"]

    @property
    def saves(self):
        return self.db["saves"]

    @property
    def blocks(self):
        return self.db["blocks"]

    @property
    def conversations(self):
        return self.db["conversations"]
