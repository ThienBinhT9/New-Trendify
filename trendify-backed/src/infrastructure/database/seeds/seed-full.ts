import { fakerVI } from "@faker-js/faker";
import bcrypt from "bcrypt";
import mongoose, { Types } from "mongoose";

import { UserModel } from "../models/user.model";
import { SettingsModel } from "../models/user-setting.model";
import { FollowModel } from "../models/follow.model";
import { PostModel } from "../models/post.model";
import { LikeModel } from "../models/like.model";
import { CommentModel } from "../models/comment.model";
import { SaveModel } from "../models/save.model";

import { EUserGender } from "@/domain/user";
import { ECommonVisibility } from "@/domain/user-setting";
import { EFollowStatus } from "@/domain/follow";
import { EPostStatus, EPostType } from "@/domain/post";
import { ECommentStatus } from "@/domain/comment";

// =============================================================================
// HOW TO RUN:
//   npx ts-node -r tsconfig-paths/register \
//     src/infrastructure/database/seeds/seed-full.ts
// =============================================================================

const MONGO_URI = "mongodb://localhost:27017/trendify";

// ─── Tunable constants ────────────────────────────────────────────────────────
const TOTAL_USERS = 50_000; // users to create
const MIN_POSTS = 100; // guaranteed posts per user
const EXTRA_POSTS = 30; // extra posts (random bonus 0..EXTRA_POSTS)
const FOLLOW_PER_USER = 80; // avg follows each user makes
const BATCH_SIZE = 2_000; // insertMany batch size (memory-safe)
const DEFAULT_PASSWORD = "phong@12345";
// ─────────────────────────────────────────────────────────────────────────────

// Vietnamese hashtag pool (realistic for social media)
const VI_HASHTAGS = [
  "trendify",
  "xuhuong",
  "daily",
  "lifestyle",
  "travel",
  "food",
  "fashionvn",
  "saigon",
  "hanoi",
  "danang",
  "vlog",
  "photography",
  "tech",
  "gaming",
  "music",
  "fitness",
  "beauty",
  "review",
  "diary",
  "motivation",
  "coding",
  "startup",
  "coffee",
  "streetfood",
  "nature",
  "sunset",
  "rainy",
  "weekend",
  "friends",
  "family",
  "love",
  "chill",
  "happylife",
  "goodvibes",
  "explore",
  "adventure",
  "Vietnam",
  "xuhuong2025",
  "trending",
  "viral",
  "reels",
  "deepthought",
  "inspiration",
  "hustle",
  "success",
  "growth",
  "health",
];

// Vietnamese content sentences (short)
const VI_SENTENCES = [
  "Hôm nay thật tuyệt vời!",
  "Cảm ơn mọi người đã ủng hộ.",
  "Cuộc sống thật đẹp khi nhìn đúng góc.",
  "Hãy là phiên bản tốt nhất của chính mình.",
  "Một ngày mới, một cơ hội mới.",
  "Thời gian không chờ đợi ai cả.",
  "Học hỏi mỗi ngày để không ngừng phát triển.",
  "Đừng so sánh bản thân với người khác.",
  "Sống chậm lại, cảm nhận nhiều hơn.",
  "Hành động ngay hôm nay, đừng để đến ngày mai.",
  "Mỗi thất bại là bài học quý giá.",
  "Tình bạn tốt là kho báu vô giá.",
  "Ăn ngon ngủ đủ, cuộc sống thêm vui.",
  "Đọc sách mỗi ngày – đầu tư tốt nhất cho bản thân.",
  "Quan trọng là bạn cảm thấy thế nào, không phải người khác nghĩ gì.",
  "Luôn biết ơn những điều nhỏ bé trong cuộc sống.",
  "Thành công không đến ngẫu nhiên.",
  "Niềm tin vào bản thân là khởi đầu của tất cả.",
  "Mỗi khoảnh khắc đều đáng để trân trọng.",
  "Yêu thương bản thân trước, rồi mới yêu thương người khác.",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function buildPostContent(mentionedUsername?: string): {
  content: string;
  hashtags: { tag: string; startIndex: number; endIndex: number }[];
  mentions: { userId: string; username: string; startIndex: number; endIndex: number }[];
} {
  const sentence = pick(VI_SENTENCES);
  const hashtagCount = fakerVI.number.int({ min: 1, max: 4 });
  const tags = pickN(VI_HASHTAGS, hashtagCount);

  let content = sentence;
  const mentions: { userId: string; username: string; startIndex: number; endIndex: number }[] = [];

  // Optionally add a mention at the start
  if (mentionedUsername) {
    const mention = `@${mentionedUsername} `;
    content = mention + content;
    mentions.push({
      userId: "", // filled later
      username: mentionedUsername,
      startIndex: 0,
      endIndex: mention.trim().length,
    });
  }

  // Append hashtags
  const hashtagStrings = tags.map((t) => `#${t}`).join(" ");
  const hashtagsStartOffset = content.length + 1;
  content = content + " " + hashtagStrings;

  const hashtags: { tag: string; startIndex: number; endIndex: number }[] = [];
  let cursor = hashtagsStartOffset;
  for (const tag of tags) {
    const raw = `#${tag}`;
    hashtags.push({ tag: tag.toLowerCase(), startIndex: cursor, endIndex: cursor + raw.length });
    cursor += raw.length + 1;
  }

  return { content, hashtags, mentions };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("🚀 Connected to MongoDB");

  // =========================================================================
  // PHASE 1 – USERS + SETTINGS
  // =========================================================================
  console.log(`\n👤 Phase 1: Creating ${TOTAL_USERS.toLocaleString()} users + settings...`);

  const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const userIds: Types.ObjectId[] = [];
  const userIndex: Map<string, { username: string; _id: Types.ObjectId }> = new Map();

  // Detect existing user count to resume without duplication
  const existingCount = await UserModel.countDocuments({});
  console.log(`   ℹ️  Existing users in DB: ${existingCount}`);

  let usersCreated = existingCount;

  while (usersCreated < TOTAL_USERS) {
    const batchUsers: any[] = [];
    const batchSettings: any[] = [];
    const currentBatch = Math.min(BATCH_SIZE, TOTAL_USERS - usersCreated);

    for (let i = 0; i < currentBatch; i++) {
      const idx = usersCreated + i;
      const uid = new Types.ObjectId();
      const gender: EUserGender = pick([EUserGender.MALE, EUserGender.FEMALE, EUserGender.OTHER]);

      batchUsers.push({
        _id: uid,
        email: `user_${idx}@yopmail.com`,
        username: `user_${idx}`,
        password: hashedPassword,
        firstName: fakerVI.person.firstName(gender === EUserGender.FEMALE ? "female" : "male"),
        lastName: fakerVI.person.lastName(),
        about: fakerVI.lorem.sentence(),
        gender,
        dateOfBirth: fakerVI.date.birthdate({ min: 16, max: 55, mode: "age" }),
        profilePicture: `https://i.pravatar.cc/150?img=${idx % 70}`,
        postCount: 0,
        followerCount: 0,
        followingCount: 0,
        isDelete: false,
        passwordVersion: 0,
        createdAt: fakerVI.date.recent({ days: 365 }),
      });

      // Randomize settings: 80% public, 10% follower-only, 10% private
      const rand = Math.random();
      const profileVisibility =
        rand < 0.8
          ? ECommonVisibility.PUBLIC
          : rand < 0.9
            ? ECommonVisibility.FOLLOWER
            : ECommonVisibility.PRIVATE;

      batchSettings.push({
        userId: uid.toString(),
        profileVisibility,
        allowFollow: Math.random() > 0.05, // 95% allow follow
        allowTagging: Math.random() > 0.1, // 90% allow tagging
        allowCommentOnProfile: Math.random() > 0.1,
        allowMessage: Math.random() > 0.1,
        showOnlineStatus: Math.random() > 0.2, // 80% show online
        showLastActiveTime: Math.random() > 0.5,
      });
    }

    await UserModel.insertMany(batchUsers, { ordered: false });
    await SettingsModel.insertMany(batchSettings, { ordered: false });

    // Cache user references for later
    for (const u of batchUsers) {
      userIds.push(u._id);
      userIndex.set(u._id.toString(), { username: u.username, _id: u._id });
    }

    usersCreated += currentBatch;
    console.log(`   ✅ Users: ${usersCreated.toLocaleString()} / ${TOTAL_USERS.toLocaleString()}`);
  }

  // If we resumed, fetch existing user IDs we missed caching
  if (userIds.length < existingCount) {
    console.log("   📡 Loading previously existing user IDs...");
    const existing = await UserModel.find({}).select("_id username").lean();
    for (const u of existing) {
      const id = u._id as Types.ObjectId;
      if (!userIndex.has(id.toString())) {
        userIds.push(id);
        userIndex.set(id.toString(), { username: u.username, _id: id });
      }
    }
  }

  const allUserIdStrings = userIds.map((id) => id.toString());
  const totalUsers = userIds.length;
  console.log(`\n   📊 Total users in memory: ${totalUsers.toLocaleString()}`);

  // =========================================================================
  // PHASE 2 – FOLLOW GRAPH
  // =========================================================================
  console.log(`\n👥 Phase 2: Building follow graph (~${FOLLOW_PER_USER} follows/user)...`);

  // Track counters in memory for bulk update
  const followerCounterMap = new Map<string, number>();
  const followingCounterMap = new Map<string, number>();
  for (const id of allUserIdStrings) {
    followerCounterMap.set(id, 0);
    followingCounterMap.set(id, 0);
  }

  const followSet = new Set<string>(); // "followerId:followingId"
  const followBatchBuffer: any[] = [];

  const flushFollows = async () => {
    if (followBatchBuffer.length === 0) return;
    await FollowModel.insertMany(followBatchBuffer, { ordered: false }).catch(() => {
      // ignore E11000 duplicates
    });
    followBatchBuffer.length = 0;
  };

  for (let i = 0; i < totalUsers; i++) {
    const followerId = allUserIdStrings[i];
    // Pick random subset to follow (avoid self-follow)
    const count = fakerVI.number.int({
      min: Math.floor(FOLLOW_PER_USER * 0.5),
      max: FOLLOW_PER_USER * 2,
    });
    const targets = new Set<number>();
    while (targets.size < Math.min(count, totalUsers - 1)) {
      const idx = Math.floor(Math.random() * totalUsers);
      if (idx !== i) targets.add(idx);
    }

    for (const targetIdx of targets) {
      const followingId = allUserIdStrings[targetIdx];
      const key = `${followerId}:${followingId}`;
      if (followSet.has(key)) continue;
      followSet.add(key);

      const status: EFollowStatus =
        Math.random() > 0.1 ? EFollowStatus.ACCEPTED : EFollowStatus.PENDING;

      followBatchBuffer.push({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
        status,
        createdAt: fakerVI.date.recent({ days: 180 }),
      });

      if (status === EFollowStatus.ACCEPTED) {
        followingCounterMap.set(followerId, (followingCounterMap.get(followerId) ?? 0) + 1);
        followerCounterMap.set(followingId, (followerCounterMap.get(followingId) ?? 0) + 1);
      }
    }

    if (followBatchBuffer.length >= BATCH_SIZE) {
      await flushFollows();
    }

    if ((i + 1) % 5000 === 0) {
      console.log(
        `   ✅ Follow graph: ${(i + 1).toLocaleString()} / ${totalUsers.toLocaleString()} users processed`,
      );
    }
  }
  await flushFollows();
  console.log("   ✅ Follow graph complete");

  // Bulk update follower/following counters
  console.log("   🔄 Updating user follower/following counters...");
  {
    const bulkOps: any[] = [];
    for (const [uid, count] of followerCounterMap.entries()) {
      const fc = count;
      const fgc = followingCounterMap.get(uid) ?? 0;
      if (fc > 0 || fgc > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: new Types.ObjectId(uid) },
            update: { $set: { followerCount: fc, followingCount: fgc } },
          },
        });
      }
    }
    for (let i = 0; i < bulkOps.length; i += 5000) {
      await UserModel.bulkWrite(bulkOps.slice(i, i + 5000));
    }
    console.log(`   ✅ Updated counters for ${bulkOps.length.toLocaleString()} users`);
  }

  // =========================================================================
  // PHASE 3 – POSTS (≥100 per user)
  // =========================================================================
  console.log(`\n📝 Phase 3: Generating posts (≥${MIN_POSTS} per user)...`);

  const allPostIds: Types.ObjectId[] = [];
  const postAuthorMap = new Map<string, string>(); // postId → authorId
  const postCounterMap = new Map<string, number>(); // userId → postCount

  const USER_CHUNK = 500; // process 500 users at a time to control memory

  for (let start = 0; start < totalUsers; start += USER_CHUNK) {
    const end = Math.min(start + USER_CHUNK, totalUsers);
    const postBatch: any[] = [];

    for (let i = start; i < end; i++) {
      const authorId = allUserIdStrings[i];
      const authorInfo = userIndex.get(authorId)!;
      const postCount = MIN_POSTS + fakerVI.number.int({ min: 0, max: EXTRA_POSTS });

      postCounterMap.set(authorId, postCount);

      for (let p = 0; p < postCount; p++) {
        const postId = new Types.ObjectId();
        allPostIds.push(postId);
        postAuthorMap.set(postId.toString(), authorId);

        // Pick a random other user for mention (30% chance)
        let mentionUsername: string | undefined;
        let mentionUserId: string | undefined;
        if (Math.random() < 0.3) {
          const mIdx = Math.floor(Math.random() * totalUsers);
          if (mIdx !== i) {
            mentionUserId = allUserIdStrings[mIdx];
            mentionUsername = userIndex.get(mentionUserId)?.username;
          }
        }

        const { content, hashtags, mentions } = buildPostContent(mentionUsername);

        // Fix userId in mention
        if (mentionUserId && mentions.length > 0) {
          mentions[0].userId = mentionUserId;
        }

        const typeRand = Math.random();
        const type =
          typeRand < 0.25 ? EPostType.IMAGE : typeRand < 0.35 ? EPostType.VIDEO : EPostType.TEXT;

        const visRand = Math.random();
        const visibility =
          visRand < 0.8
            ? ECommonVisibility.PUBLIC
            : visRand < 0.95
              ? ECommonVisibility.FOLLOWER
              : ECommonVisibility.PRIVATE;

        postBatch.push({
          _id: postId,
          authorId: new Types.ObjectId(authorId),
          type,
          content,
          hashtags,
          mentions,
          mediaIds: [], // no actual media — seeding avoids S3
          status: EPostStatus.ACTIVE,
          isPinned: p === 0 && Math.random() < 0.1, // 10% chance first post is pinned
          settings: {
            visibility,
            allowLike: true,
            allowSave: true,
            allowShare: true,
            allowComment: Math.random() > 0.05,
            allowDownload: Math.random() > 0.2,
          },
          counters: {
            likeCount: 0,
            commentCount: 0,
            viewCount: fakerVI.number.int({ min: 50, max: 10_000 }),
            shareCount: fakerVI.number.int({ min: 0, max: 200 }),
            saveCount: 0,
            repostCount: 0,
          },
          createdAt: fakerVI.date.recent({ days: 365 }),
        });
      }
    }

    // Flush post batch
    for (let b = 0; b < postBatch.length; b += BATCH_SIZE) {
      await PostModel.insertMany(postBatch.slice(b, b + BATCH_SIZE), { ordered: false });
    }

    const usersProcessed = Math.min(end, totalUsers);
    console.log(
      `   ✅ Posts: ${usersProcessed.toLocaleString()} / ${totalUsers.toLocaleString()} users done ` +
        `(~${allPostIds.length.toLocaleString()} posts total)`,
    );
  }

  // Update postCount on users
  console.log("   🔄 Updating postCount on users...");
  {
    const bulkOps: any[] = [];
    for (const [uid, count] of postCounterMap.entries()) {
      bulkOps.push({
        updateOne: {
          filter: { _id: new Types.ObjectId(uid) },
          update: { $set: { postCount: count } },
        },
      });
    }
    for (let i = 0; i < bulkOps.length; i += 5000) {
      await UserModel.bulkWrite(bulkOps.slice(i, i + 5000));
    }
    console.log(`   ✅ postCount updated for ${bulkOps.length.toLocaleString()} users`);
  }

  console.log(`\n   📊 Total posts created: ${allPostIds.length.toLocaleString()}`);

  // =========================================================================
  // PHASE 4 – LIKES (random, ~5 likes per post on average)
  // =========================================================================
  console.log("\n❤️  Phase 4: Generating likes...");

  const LIKES_PER_POST_AVG = 5;
  const TOTAL_LIKES = Math.min(allPostIds.length * LIKES_PER_POST_AVG, 5_000_000);
  const likeCounterMap = new Map<string, number>(); // postId → likeCount

  let likesInserted = 0;
  const likeBatch: any[] = [];
  const likeSet = new Set<string>(); // "userId:postId"

  const flushLikes = async () => {
    if (likeBatch.length === 0) return;
    await LikeModel.insertMany(likeBatch, { ordered: false }).catch(() => {
      // ignore E11000 duplicates
    });
    likeBatch.length = 0;
  };

  while (likesInserted < TOTAL_LIKES) {
    const postId = allPostIds[Math.floor(Math.random() * allPostIds.length)];
    const userId = allUserIdStrings[Math.floor(Math.random() * totalUsers)];
    const key = `${userId}:${postId}`;

    if (!likeSet.has(key)) {
      likeSet.add(key);
      likeBatch.push({
        userId: new Types.ObjectId(userId),
        postId,
        createdAt: fakerVI.date.recent({ days: 90 }),
      });
      likeCounterMap.set(postId.toString(), (likeCounterMap.get(postId.toString()) ?? 0) + 1);
      likesInserted++;
    }

    if (likeBatch.length >= BATCH_SIZE) {
      await flushLikes();
      if (likesInserted % 100_000 === 0) {
        console.log(
          `   ✅ Likes: ${likesInserted.toLocaleString()} / ${TOTAL_LIKES.toLocaleString()}`,
        );
      }
    }
  }
  await flushLikes();
  console.log(`   ✅ Likes total: ${likesInserted.toLocaleString()}`);

  // =========================================================================
  // PHASE 5 – COMMENTS (~3 per post on average)
  // =========================================================================
  console.log("\n💬 Phase 5: Generating comments...");

  const COMMENTS_PER_POST_AVG = 3;
  const TOTAL_COMMENTS = Math.min(allPostIds.length * COMMENTS_PER_POST_AVG, 3_000_000);
  const commentCounterMap = new Map<string, number>(); // postId → commentCount

  let commentsInserted = 0;
  const commentBatch: any[] = [];

  const flushComments = async () => {
    if (commentBatch.length === 0) return;
    await CommentModel.insertMany(commentBatch, { ordered: false });
    commentBatch.length = 0;
  };

  while (commentsInserted < TOTAL_COMMENTS) {
    const postId = allPostIds[Math.floor(Math.random() * allPostIds.length)];
    const authorId = allUserIdStrings[Math.floor(Math.random() * totalUsers)];

    // 20% chance of mention in comment
    const mentions: any[] = [];
    if (Math.random() < 0.2) {
      const mIdx = Math.floor(Math.random() * totalUsers);
      const mId = allUserIdStrings[mIdx];
      const mUsername = userIndex.get(mId)?.username ?? "user";
      mentions.push({
        userId: new Types.ObjectId(mId),
        username: mUsername,
        startIndex: 0,
        endIndex: mUsername.length + 1,
      });
    }

    commentBatch.push({
      postId,
      authorId: new Types.ObjectId(authorId),
      content: pick(VI_SENTENCES) + (mentions.length ? ` @${mentions[0].username}` : ""),
      mentions,
      hashtags: [],
      mediaIds: [],
      parentId: null,
      rootCommentId: null,
      status: ECommentStatus.ACTIVE,
      counters: { replyCount: 0, likeCount: 0 },
      createdAt: fakerVI.date.recent({ days: 90 }),
    });

    commentCounterMap.set(postId.toString(), (commentCounterMap.get(postId.toString()) ?? 0) + 1);
    commentsInserted++;

    if (commentBatch.length >= BATCH_SIZE) {
      await flushComments();
      if (commentsInserted % 100_000 === 0) {
        console.log(
          `   ✅ Comments: ${commentsInserted.toLocaleString()} / ${TOTAL_COMMENTS.toLocaleString()}`,
        );
      }
    }
  }
  await flushComments();
  console.log(`   ✅ Comments total: ${commentsInserted.toLocaleString()}`);

  // =========================================================================
  // PHASE 6 – SAVES (~1 per post on average)
  // =========================================================================
  console.log("\n🔖 Phase 6: Generating saves...");

  const SAVES_PER_POST_AVG = 1;
  const TOTAL_SAVES = Math.min(allPostIds.length * SAVES_PER_POST_AVG, 1_000_000);
  const saveCounterMap = new Map<string, number>(); // postId → saveCount

  let savesInserted = 0;
  const saveBatch: any[] = [];
  const saveSet = new Set<string>();

  const flushSaves = async () => {
    if (saveBatch.length === 0) return;
    await SaveModel.insertMany(saveBatch, { ordered: false }).catch(() => {
      // ignore E11000
    });
    saveBatch.length = 0;
  };

  while (savesInserted < TOTAL_SAVES) {
    const postId = allPostIds[Math.floor(Math.random() * allPostIds.length)];
    const userId = allUserIdStrings[Math.floor(Math.random() * totalUsers)];
    const key = `${userId}:${postId}`;

    if (!saveSet.has(key)) {
      saveSet.add(key);
      saveBatch.push({
        userId: new Types.ObjectId(userId),
        postId,
        createdAt: fakerVI.date.recent({ days: 60 }),
      });
      saveCounterMap.set(postId.toString(), (saveCounterMap.get(postId.toString()) ?? 0) + 1);
      savesInserted++;
    }

    if (saveBatch.length >= BATCH_SIZE) {
      await flushSaves();
    }
  }
  await flushSaves();
  console.log(`   ✅ Saves total: ${savesInserted.toLocaleString()}`);

  // =========================================================================
  // PHASE 7 – BULK UPDATE POST COUNTERS
  // =========================================================================
  console.log("\n🔄 Phase 7: Updating post counters (likes/comments/saves)...");

  const postBulkOps: any[] = [];
  for (const postId of allPostIds) {
    const pid = postId.toString();
    const likeCount = likeCounterMap.get(pid) ?? 0;
    const commentCount = commentCounterMap.get(pid) ?? 0;
    const saveCount = saveCounterMap.get(pid) ?? 0;

    if (likeCount > 0 || commentCount > 0 || saveCount > 0) {
      postBulkOps.push({
        updateOne: {
          filter: { _id: postId },
          update: {
            $set: {
              "counters.likeCount": likeCount,
              "counters.commentCount": commentCount,
              "counters.saveCount": saveCount,
            },
          },
        },
      });
    }
  }

  for (let i = 0; i < postBulkOps.length; i += 5000) {
    await PostModel.bulkWrite(postBulkOps.slice(i, i + 5000));
    if (i % 100_000 === 0) {
      console.log(
        `   ... ${i.toLocaleString()} / ${postBulkOps.length.toLocaleString()} posts updated`,
      );
    }
  }
  console.log(`   ✅ Post counters updated for ${postBulkOps.length.toLocaleString()} posts`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n🎉 Full seeding complete!");
  console.log(`   👤 Users:    ${totalUsers.toLocaleString()}`);
  console.log(`   🔗 Follows:  ~${followSet.size.toLocaleString()}`);
  console.log(`   📝 Posts:    ${allPostIds.length.toLocaleString()}`);
  console.log(`   ❤️  Likes:    ${likesInserted.toLocaleString()}`);
  console.log(`   💬 Comments: ${commentsInserted.toLocaleString()}`);
  console.log(`   🔖 Saves:    ${savesInserted.toLocaleString()}`);

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB");
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
