import { Db } from "mongodb";

export async function run(db: Db) {
  await db
    .collection("settings")
    .createIndex({ userId: 1 }, { unique: true, name: "idx_userId_unique" });

  await db
    .collection("settings")
    .createIndex({ profileVisibility: 1 }, { name: "idx_profileVisibility" });

  console.log("Settings indexes created");
}
