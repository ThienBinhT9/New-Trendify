import { Db } from "mongodb";

export async function run(db: Db) {
  await db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, background: true, name: "uniq_users_email" });

  await db
    .collection("users")
    .createIndex({ username: 1 }, { unique: true, background: true, name: "uniq_users_username" });

  await db.collection("users").createIndex(
    { isDelete: 1 },
    {
      partialFilterExpression: { isDelete: false },
      name: "idx_users_isDelete_false",
      background: true,
    },
  );

  await db.collection("userintents").createIndex(
    { email: 1 },
    {
      unique: true,
      background: true,
      partialFilterExpression: {
        status: { $in: ["PENDING", "VERIFIED"] },
      },
      name: "uniq_userintents_email_active",
    },
  );

  await db.collection("userintents").createIndex(
    { tokenHash: 1 },
    {
      background: true,
      name: "idx_userintents_tokenHash",
    },
  );

  await db.collection("userintents").createIndex(
    { status: 1 },
    {
      background: true,
      name: "idx_userintents_status",
    },
  );

  await db.collection("userintents").createIndex(
    { expiresAt: 1 },
    {
      expireAfterSeconds: 0,
      background: true,
      partialFilterExpression: {
        status: { $in: ["PENDING", "VERIFIED"] },
      },
      name: "ttl_userintents_expiresAt",
    },
  );

  await db.collection("userintents").createIndex(
    { email: 1, status: 1 },
    {
      background: true,
      name: "idx_userintents_email_status",
    },
  );

  console.log("User indexes created");
}
