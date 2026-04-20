import { Db } from "mongodb";

/**
 * Migration 006: Post & related collection indexes
 *
 * Covers: posts, comments, likes, saves, blocks, medias, commentlikes
 * Fully idempotent: checks by name before creating, drops conflicting indexes.
 */

async function getExistingIndexes(collection: ReturnType<Db["collection"]>) {
  try {
    return await collection.indexes();
  } catch (err: any) {
    if (err?.code === 26) return []; // NamespaceNotFound — collection doesn't exist yet
    throw err;
  }
}

async function collectionExists(db: Db, name: string): Promise<boolean> {
  const colls = await db.listCollections({ name }).toArray();
  return colls.length > 0;
}

/**
 * Ensures an index exists with the exact name and key spec provided.
 *
 * Handles all four cases:
 *  A) Same name, same key     → skip (already correct)
 *  B) Same name, diff key     → drop by name, recreate
 *  C) Diff name, same key     → drop old auto-named index, recreate with our name
 *  D) Not found at all        → create fresh
 */
async function ensureIndex(
  collection: ReturnType<Db["collection"]>,
  keys: Record<string, any>,
  options: Record<string, any>,
) {
  const wantedName: string = options.name;
  const wantedKey = JSON.stringify(keys);

  const existingIndexes = await getExistingIndexes(collection);
  if (existingIndexes.length === 0) {
    // Collection doesn't exist yet — createIndex will create it
    await collection.createIndex(keys, options);
    return;
  }

  // Case A/B: index with our canonical name exists
  const byName = existingIndexes.find((idx) => idx.name === wantedName);
  if (byName) {
    if (JSON.stringify(byName.key) === wantedKey) {
      return; // A: perfect match — skip
    }
    // B: same name, different key — drop and recreate
    console.log(`  ⚠️  Drop index "${wantedName}" (key mismatch) on ${collection.collectionName}`);
    await collection.dropIndex(wantedName);
    await collection.createIndex(keys, options);
    return;
  }

  // Case C: same key already indexed under a different (auto-generated) name
  const byKey = existingIndexes.find((idx) => JSON.stringify(idx.key) === wantedKey);
  if (byKey) {
    console.log(`  ⚠️  Renaming index "${byKey.name}" → "${wantedName}" on ${collection.collectionName}`);
    await collection.dropIndex(byKey.name as string);
    await collection.createIndex(keys, options);
    return;
  }

  // Case D: brand new index
  await collection.createIndex(keys, options);
}


export async function run(db: Db) {
  // ============================================================================
  // POSTS
  // ============================================================================
  const posts = db.collection("posts");

  await ensureIndex(posts, { authorId: 1, status: 1, "settings.visibility": 1, _id: -1 }, { name: "user_posts_cursor", background: true });
  await ensureIndex(posts, { authorId: 1, isPinned: 1, status: 1, _id: -1 }, { name: "user_pinned_posts", background: true });
  await ensureIndex(posts, { authorId: 1, type: 1, status: 1, _id: -1 }, { name: "user_posts_by_type", background: true });
  await ensureIndex(posts, { "hashtags.tag": 1, status: 1, _id: -1 }, { name: "hashtag_search", background: true });
  // replyToId — drop old non-sparse version if it exists, recreate with sparse
  await ensureIndex(posts, { replyToId: 1, status: 1, _id: -1 }, { name: "post_replies", background: true, sparse: true });
  await ensureIndex(posts, { rootPostId: 1, status: 1, _id: 1 }, { name: "thread_posts", background: true, sparse: true });
  await ensureIndex(posts, { status: 1, "settings.visibility": 1, createdAt: -1 }, { name: "feed_generation", background: true });
  await ensureIndex(posts, { _id: 1, status: 1 }, { name: "post_lookup", background: true });

  // Full-text — cannot be dropped easily if data exists; only create if absent
  const postIndexes = await posts.indexes();
  if (!postIndexes.find((idx) => idx.name === "content_search")) {
    await posts.createIndex({ content: "text" }, { name: "content_search", weights: { content: 1 }, background: true });
  }

  // 2dsphere — sparse by nature
  const geoExists = postIndexes.find((idx) => idx.name === "location_geo");
  if (!geoExists) {
    await posts.createIndex({ "location.coordinates": "2dsphere" }, { name: "location_geo", background: true, sparse: true });
  }

  console.log("  ✅ Post indexes done");

  // ============================================================================
  // COMMENTS
  // ============================================================================
  const comments = db.collection("comments");

  await ensureIndex(comments, { postId: 1, parentId: 1, status: 1, _id: -1 }, { name: "post_top_level_comments", background: true });
  await ensureIndex(comments, { parentId: 1, status: 1, _id: 1 }, { name: "comment_replies", background: true, sparse: true });
  await ensureIndex(comments, { authorId: 1, _id: -1 }, { name: "author_comments", background: true });
  await ensureIndex(comments, { postId: 1 }, { name: "post_all_comments", background: true });

  console.log("  ✅ Comment indexes done");

  // ============================================================================
  // LIKES
  // ============================================================================
  const likes = db.collection("likes");

  await ensureIndex(likes, { userId: 1, postId: 1 }, { unique: true, name: "uniq_like_user_post", background: true });
  await ensureIndex(likes, { postId: 1, _id: -1 }, { name: "likes_by_post", background: true });
  await ensureIndex(likes, { userId: 1, _id: -1 }, { name: "likes_by_user", background: true });

  console.log("  ✅ Like indexes done");

  // ============================================================================
  // SAVES
  // ============================================================================
  const saves = db.collection("saves");

  await ensureIndex(saves, { userId: 1, postId: 1 }, { unique: true, name: "uniq_save_user_post", background: true });
  await ensureIndex(saves, { userId: 1, _id: -1 }, { name: "saves_by_user", background: true });

  console.log("  ✅ Save indexes done");

  // ============================================================================
  // BLOCKS
  // ============================================================================
  const blocks = db.collection("blocks");

  await ensureIndex(blocks, { blockerId: 1, blockedId: 1 }, { unique: true, name: "uniq_block_pair", background: true });
  await ensureIndex(blocks, { blockedId: 1, blockerId: 1 }, { name: "block_reverse_check", background: true });
  await ensureIndex(blocks, { blockerId: 1, _id: -1 }, { name: "blocks_by_blocker", background: true });

  console.log("  ✅ Block indexes done");

  // ============================================================================
  // MEDIAS (skip gracefully if collection doesn't exist yet)
  // ============================================================================
  if (await collectionExists(db, "medias")) {
    const medias = db.collection("medias");

    await ensureIndex(medias, { key: 1 }, { unique: true, name: "uniq_media_key", background: true });
    await ensureIndex(medias, { userId: 1, purpose: 1, status: 1, _id: -1 }, { name: "user_media_by_purpose", background: true });
    await ensureIndex(medias, { status: 1, createdAt: 1 }, { name: "media_by_status", background: true });

    const mediaIndexes = await getExistingIndexes(medias);
    if (!mediaIndexes.find((idx) => idx.name === "pending_upload_ttl")) {
      await medias.createIndex(
        { expiresAt: 1 },
        { name: "pending_upload_ttl", expireAfterSeconds: 0, partialFilterExpression: { status: "pending_upload" }, background: true },
      );
    }

    console.log("  ✅ Media indexes done");
  } else {
    console.log("  ℹ️  medias collection not found — skipping (will be created on first upload)");
  }

  // ============================================================================
  // COMMENT LIKES
  // ============================================================================
  const commentLikes = db.collection("commentlikes");

  await ensureIndex(commentLikes, { userId: 1, commentId: 1 }, { unique: true, name: "uniq_commentlike_user_comment", background: true });
  await ensureIndex(commentLikes, { commentId: 1, _id: -1 }, { name: "commentlikes_by_comment", background: true });

  console.log("  ✅ CommentLike indexes done");
  console.log("✅ Migration 006 complete");
}

