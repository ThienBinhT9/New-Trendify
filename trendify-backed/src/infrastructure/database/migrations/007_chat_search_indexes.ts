import { Db } from "mongodb";

/**
 * Migration 007: Chat & Search collection indexes
 *
 * Covers:
 *   - conversations
 *   - messages
 *   - messagerequests
 *   - searchhistories
 *   - recentlyvieweds
 *
 * Fully idempotent: uses ensureIndex to skip / rename / recreate safely.
 */

// ─── Helpers (duplicated locally; migrations are standalone scripts) ──────────

async function getExistingIndexes(collection: ReturnType<Db["collection"]>) {
  try {
    return await collection.indexes();
  } catch (err: any) {
    if (err?.code === 26) return []; // NamespaceNotFound
    throw err;
  }
}

async function collectionExists(db: Db, name: string): Promise<boolean> {
  const colls = await db.listCollections({ name }).toArray();
  return colls.length > 0;
}

async function ensureIndex(
  collection: ReturnType<Db["collection"]>,
  keys: Record<string, any>,
  options: Record<string, any>,
) {
  const wantedName: string = options.name;
  const wantedKey = JSON.stringify(keys);
  const existingIndexes = await getExistingIndexes(collection);

  if (existingIndexes.length === 0) {
    await collection.createIndex(keys, options);
    return;
  }

  const byName = existingIndexes.find((idx) => idx.name === wantedName);
  if (byName) {
    if (JSON.stringify(byName.key) === wantedKey) return; // A: already correct
    console.log(`  ⚠️  Drop index "${wantedName}" (key mismatch) on ${collection.collectionName}`);
    await collection.dropIndex(wantedName);
    await collection.createIndex(keys, options);
    return;
  }

  const byKey = existingIndexes.find((idx) => JSON.stringify(idx.key) === wantedKey);
  if (byKey) {
    console.log(`  ⚠️  Rename "${byKey.name}" → "${wantedName}" on ${collection.collectionName}`);
    await collection.dropIndex(byKey.name as string);
    await collection.createIndex(keys, options);
    return;
  }

  await collection.createIndex(keys, options);
}

async function ensureTextIndex(
  collection: ReturnType<Db["collection"]>,
  keys: Record<string, any>,
  options: Record<string, any>,
) {
  // Text indexes: only one allowed per collection; skip if already exists
  const existing = await getExistingIndexes(collection);
  const hasText = existing.some((idx) =>
    Object.values(idx.key as Record<string, any>).includes("text"),
  );
  if (hasText) return;
  await collection.createIndex(keys, options);
}

async function ensureTtlIndex(
  collection: ReturnType<Db["collection"]>,
  keys: Record<string, any>,
  options: Record<string, any>,
) {
  // TTL indexes: MongoDB won't let you change expireAfterSeconds via createIndex
  const wantedName: string = options.name;
  const existing = await getExistingIndexes(collection);
  const byName = existing.find((idx) => idx.name === wantedName);
  if (byName) return; // already exists — skip
  await collection.createIndex(keys, options);
}

// ─── Migration ────────────────────────────────────────────────────────────────

export async function run(db: Db) {
  // ==========================================================================
  // CONVERSATIONS
  // ==========================================================================
  const conversations = db.collection("conversations");

  // Primary inbox: user's conversations sorted by latest message
  await ensureIndex(
    conversations,
    { "members.userId": 1, "lastMessage.createdAt": -1 },
    { name: "member_inbox", background: true },
  );

  // Direct conversation lookup (partial filter: DM only)
  await ensureIndex(
    conversations,
    { type: 1, "members.userId": 1 },
    { name: "direct_conversation_lookup", background: true, partialFilterExpression: { type: "direct" } },
  );

  // Archive / pin filtering within inbox
  await ensureIndex(
    conversations,
    { "members.userId": 1, "members.isArchived": 1, "members.isPinned": 1 },
    { name: "member_inbox_filters", background: true },
  );

  // Soft-delete filter
  await ensureIndex(
    conversations,
    { isDeleted: 1 },
    { name: "conversation_not_deleted", background: true, partialFilterExpression: { isDeleted: false } },
  );

  console.log("  ✅ Conversation indexes done");

  // ==========================================================================
  // MESSAGES
  // ==========================================================================
  const messages = db.collection("messages");

  // Primary: cursor-based pagination per conversation (hottest path)
  await ensureIndex(
    messages,
    { conversationId: 1, _id: -1 },
    { name: "conversation_messages", background: true },
  );

  // Date-sorted per conversation (for search, media gallery)
  await ensureIndex(
    messages,
    { conversationId: 1, createdAt: -1 },
    { name: "conversation_messages_by_date", background: true },
  );

  // Unread count: messages not read by a user in a conversation
  await ensureIndex(
    messages,
    { conversationId: 1, "readBy.userId": 1 },
    { name: "unread_count", background: true },
  );

  // Sender lookup (admin / moderation)
  await ensureIndex(
    messages,
    { senderId: 1, createdAt: -1 },
    { name: "sender_messages", background: true },
  );

  // Full-text search on message content (only one text index per collection)
  await ensureTextIndex(
    messages,
    { content: "text" },
    { name: "message_content_search", background: true },
  );

  console.log("  ✅ Message indexes done");

  // ==========================================================================
  // MESSAGE REQUESTS
  // ==========================================================================
  if (await collectionExists(db, "messagerequests")) {
    const msgReqs = db.collection("messagerequests");

    // Recipient inbox: pending requests, newest first
    await ensureIndex(
      msgReqs,
      { recipientId: 1, status: 1, _id: -1 },
      { name: "recipient_requests", background: true },
    );

    // Unique pending request between two users (partial filter)
    await ensureIndex(
      msgReqs,
      { senderId: 1, recipientId: 1 },
      {
        name: "unique_pending_request",
        unique: true,
        background: true,
        partialFilterExpression: { status: "PENDING" },
      },
    );

    // TTL: auto-cleanup declined requests after 30 days
    await ensureTtlIndex(
      msgReqs,
      { updatedAt: 1 },
      {
        name: "declined_ttl",
        expireAfterSeconds: 30 * 24 * 60 * 60,
        background: true,
        partialFilterExpression: { status: "DECLINED" },
      },
    );

    console.log("  ✅ MessageRequest indexes done");
  } else {
    console.log("  ℹ️  messagerequests not found — skipping");
  }

  // ==========================================================================
  // SEARCH HISTORY
  // ==========================================================================
  if (await collectionExists(db, "searchhistories")) {
    const searchHist = db.collection("searchhistories");

    // Recent search history per user (not deleted)
    await ensureIndex(
      searchHist,
      { userId: 1, deletedAt: 1, updatedAt: -1 },
      { name: "user_search_history", background: true },
    );

    // Dedup lookup: existing entry for same keyword
    await ensureIndex(
      searchHist,
      { userId: 1, keyword: 1, deletedAt: 1 },
      { name: "dedup_lookup", background: true },
    );

    // Autocomplete prefix
    await ensureIndex(
      searchHist,
      { userId: 1, keyword: 1, deletedAt: 1, updatedAt: -1 },
      { name: "autocomplete_prefix", background: true },
    );

    // TTL: auto-delete after 30 days
    await ensureTtlIndex(
      searchHist,
      { updatedAt: 1 },
      {
        name: "ttl_cleanup",
        expireAfterSeconds: 30 * 24 * 60 * 60,
        background: true,
      },
    );

    console.log("  ✅ SearchHistory indexes done");
  } else {
    console.log("  ℹ️  searchhistories not found — skipping");
  }

  // ==========================================================================
  // RECENTLY VIEWED
  // ==========================================================================
  if (await collectionExists(db, "recentlyvieweds")) {
    const recentlyViewed = db.collection("recentlyvieweds");

    // Unique constraint: 1 entry per (user, resource, type) — supports upsert
    await ensureIndex(
      recentlyViewed,
      { userId: 1, resourceId: 1, resourceType: 1 },
      { name: "unique_user_resource", unique: true, background: true },
    );

    // User's recent history sorted by viewedAt desc
    await ensureIndex(
      recentlyViewed,
      { userId: 1, viewedAt: -1 },
      { name: "user_recent_viewed", background: true },
    );

    // TTL: auto-delete after 30 days
    await ensureTtlIndex(
      recentlyViewed,
      { viewedAt: 1 },
      {
        name: "ttl_cleanup",
        expireAfterSeconds: 30 * 24 * 60 * 60,
        background: true,
      },
    );

    console.log("  ✅ RecentlyViewed indexes done");
  } else {
    console.log("  ℹ️  recentlyvieweds not found — skipping");
  }

  console.log("✅ Migration 007 complete");
}
