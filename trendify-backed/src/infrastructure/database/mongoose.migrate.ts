import { run as runIndexUsers } from "./migrations/001_user_indexes";
import { run as runIndexSessions } from "./migrations/002_session_indexes";
import { run as runIndexFollows } from "./migrations/003_follow_indexes";
import { run as runIndexSettings } from "./migrations/004_setting_indexes";

import mongoose from "mongoose";

const MONGO_URI = "mongodb://localhost:27017/trendify";

//npx ts-node src/infrastructure/database/mongoose.migrate.ts

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  console.log("🚀 Running migrations...");

  // await runIndexUsers(db);
  // await runIndexSessions(db);
  await runIndexFollows(db);
  await runIndexSettings(db);

  console.log("🎉 All migrations done");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("❌ Migration failed", err);
  process.exit(1);
});
