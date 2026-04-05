import { Db } from "mongodb";

/**
 * Migration: Notification Index Refactor for Aggregated Notifications
 *
 * Background:
 * Previously, all notification types used a single unique index:
 *   { recipientId: 1, type: 1, actorId: 1, targetId: 1 }
 * This meant 200 likes on 1 post = 200 notification documents.
 *
 * New design:
 * - Non-aggregated types (follow, comment, mention): keep per-actor unique index
 * - Aggregated types (post_like): 1 document per (recipient + type + target)
 *
 * This migration:
 * 1. Drops the old "unique_notification" index
 * 2. Creates two partial unique indexes
 */
export async function run(db: Db) {
  const collection = db.collection("notifications");

  // Step 1: Drop old index if it exists
  const existingIndexes = await collection.indexes();
  const oldIndex = existingIndexes.find((idx) => idx.name === "unique_notification");

  if (oldIndex) {
    console.log("  Dropping old unique_notification index...");
    await collection.dropIndex("unique_notification");
    console.log("  ✅ Old index dropped");
  } else {
    console.log("  ℹ️  Old unique_notification index not found, skipping drop");
  }

  // Step 2: Create new partial unique index for NON-AGGREGATED types
  const nonAggIdx = existingIndexes.find((idx) => idx.name === "unique_non_aggregated");
  if (!nonAggIdx) {
    console.log("  Creating unique_non_aggregated index...");
    await collection.createIndex(
      { recipientId: 1, type: 1, actorId: 1, targetId: 1 },
      {
        unique: true,
        name: "unique_non_aggregated",
        partialFilterExpression: {
          type: { $in: ["follow", "follow_request", "post_mention", "post_comment"] },
        },
      },
    );
    console.log("  ✅ unique_non_aggregated index created");
  } else {
    console.log("  ℹ️  unique_non_aggregated already exists, skipping");
  }

  // Step 3: Deduplicate existing post_like notifications before creating aggregated index
  // Old schema had one document per actor, new schema needs one per (recipient + target)
  console.log("  Deduplicating old post_like notifications...");

  const pipeline = [
    { $match: { type: "post_like" } },
    {
      $group: {
        _id: { recipientId: "$recipientId", targetId: "$targetId" },
        docs: { $push: "$_id" },
        count: { $sum: 1 },
        latestActors: { $push: "$actorId" },
        newest: { $max: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ];

  const duplicateGroups = await collection.aggregate(pipeline).toArray();
  let totalRemoved = 0;

  for (const group of duplicateGroups) {
    // Keep the newest document, delete the rest
    const idsToDelete = group.docs.filter(
      (id: any) => id.toString() !== group.newest.toString(),
    );

    if (idsToDelete.length > 0) {
      // Before deleting, update the kept document with aggregated data
      const latestTwoActors = group.latestActors
        .reverse() // newest first (since $push adds oldest first)
        .slice(0, 2);

      await collection.updateOne(
        { _id: group.newest },
        {
          $set: {
            latestActors: latestTwoActors,
            totalActorCount: group.count,
            actorId: null,
          },
        },
      );

      await collection.deleteMany({ _id: { $in: idsToDelete } });
      totalRemoved += idsToDelete.length;
    }
  }

  console.log(`  ✅ Deduplicated: ${duplicateGroups.length} groups, ${totalRemoved} documents removed`);

  // Step 4: Create new partial unique index for AGGREGATED types
  const aggIdx = existingIndexes.find((idx) => idx.name === "unique_aggregated");
  if (!aggIdx) {
    console.log("  Creating unique_aggregated index...");
    await collection.createIndex(
      { recipientId: 1, type: 1, targetId: 1 },
      {
        unique: true,
        name: "unique_aggregated",
        partialFilterExpression: {
          type: { $in: ["post_like"] },
        },
      },
    );
    console.log("  ✅ unique_aggregated index created");
  } else {
    console.log("  ℹ️  unique_aggregated already exists, skipping");
  }

  console.log("  ✅ Notification index migration complete");
}
