/**
 * Trendify – Master Migration Runner
 *
 * Run:  yarn migrate   (or npx ts-node -r tsconfig-paths/register src/infrastructure/database/mongoose.migrate.ts)
 *
 * All migration files use the ensureIndex helper — safe to re-run on an
 * existing database (idempotent).  Already-correct indexes are skipped,
 * conflicting / auto-named ones are dropped and recreated.
 *
 * Migration list
 * ──────────────
 * 001  users, userintents
 * 002  sessions
 * 003  follows
 * 004  settings
 * 005  notifications
 * 006  posts, comments, likes, saves, blocks, medias, commentlikes
 * 007  conversations, messages, messagerequests, searchhistories, recentlyvieweds
 */

import mongoose from "mongoose";

import { run as migration001 } from "./migrations/001_user_indexes";
import { run as migration002 } from "./migrations/002_session_indexes";
import { run as migration003 } from "./migrations/003_follow_indexes";
import { run as migration004 } from "./migrations/004_setting_indexes";
import { run as migration005 } from "./migrations/005_notification_indexes";
import { run as migration006 } from "./migrations/006_post_indexes";
import { run as migration007 } from "./migrations/007_chat_search_indexes";

const MONGO_URI = "mongodb://localhost:27017/trendify";

// ─── helpers shared across OLD migrations (001–005) ───────────────────────────
// Those files call db.collection().createIndex() directly without the
// idempotent wrapper, so we wrap each run() in a try/catch that swallows
// "index already exists with same name/key" errors (codes 85, 86) which
// are safe to ignore on a database that was already migrated.

async function runSafe(name: string, fn: (db: any) => Promise<void>, db: any) {
  console.log(`\n▶ Running ${name}...`);
  try {
    await fn(db);
  } catch (err: any) {
    const code = err?.code ?? err?.errorResponse?.code;
    if (code === 85 || code === 86) {
      // IndexOptionsConflict / IndexKeySpecsConflict — index already exists, skip
      console.log(`  ℹ️  ${name}: index already exists — skipped (${err.message?.slice(0, 80)}...)`);
    } else {
      throw err; // unexpected error — re-throw
    }
  }
}

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  console.log("🚀 Running all migrations...");

  await runSafe("001 – user & userintent indexes",    migration001, db);
  await runSafe("002 – session indexes",              migration002, db);
  await runSafe("003 – follow indexes",               migration003, db);
  await runSafe("004 – settings indexes",             migration004, db);
  await runSafe("005 – notification indexes",         migration005, db);
  await runSafe("006 – post & related indexes",       migration006, db);
  await runSafe("007 – chat & search indexes",        migration007, db);

  console.log("\n🎉 All migrations done");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("❌ Migration failed", err);
  process.exit(1);
});
