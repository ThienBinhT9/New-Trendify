import mongoose from "mongoose";
import { UserModel, FollowModel } from "@/infrastructure/database/models";

const MONGO_URI = "mongodb://localhost:27017/trendify";
const FOLLOW_LIMIT = 5000;

async function seedFollowWhale() {
  await mongoose.connect(MONGO_URI);
  console.log("🐋 Seeding whale follow...");

  // 1️⃣ Lấy user làm whale
  const whale = await UserModel.findOne({}).select("_id").lean();
  if (!whale) throw new Error("No user found");

  // 2️⃣ Lấy các user khác
  const targets = await UserModel.find({ _id: { $ne: whale._id } })
    .select("_id")
    .limit(FOLLOW_LIMIT)
    .lean();

  if (targets.length === 0) {
    console.log("⚠️ No target users");
    return;
  }

  const followOps: any[] = [];
  const insertedTargets: any[] = [];

  for (const u of targets) {
    followOps.push({
      updateOne: {
        filter: {
          followerId: whale._id,
          followingId: u._id,
        },
        update: {
          $setOnInsert: {
            followerId: whale._id,
            followingId: u._id,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    });

    insertedTargets.push(u._id);
  }

  const result = await FollowModel.bulkWrite(followOps, {
    ordered: false,
  });

  const insertedCount = Object.keys(result.upsertedIds).length;

  if (insertedCount === 0) {
    console.log("⚠️ No new follows inserted");
    return;
  }

  // 3️⃣ Update counters
  await UserModel.updateOne({ _id: whale._id }, { $inc: { followingCount: insertedCount } });

  await UserModel.updateMany({ _id: { $in: insertedTargets } }, { $inc: { followerCount: 1 } });

  console.log(`✅ Whale followed ${insertedCount} users`);

  await mongoose.disconnect();
}

seedFollowWhale().catch((err) => {
  console.error(err);
  process.exit(1);
});
