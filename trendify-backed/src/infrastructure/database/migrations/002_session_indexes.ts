import { Db } from "mongodb";

export async function run(db: Db) {
  await db.collection("sessions").createIndex(
    { userId: 1, deviceId: 1 },
    {
      unique: true,
      background: true,
      partialFilterExpression: { isRevoked: false },
      name: "uniq_sessions_user_device_active",
    }
  );

  await db.collection("sessions").createIndex(
    { userId: 1, isRevoked: 1 },
    {
      background: true,
      name: "idx_sessions_user_isRevoked",
    }
  );

  await db.collection("sessions").createIndex(
    { expiresAt: 1 },
    {
      expireAfterSeconds: 0,
      background: true,
      name: "ttl_sessions_expiresAt",
    }
  );

  await db.collection("sessions").createIndex(
    { refreshTokenHash: 1 },
    {
      unique: true,
      background: true,
      name: "uniq_sessions_refreshTokenHash",
    }
  );

  console.log("Session indexes created");
}
