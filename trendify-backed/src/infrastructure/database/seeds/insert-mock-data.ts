import { fakerVI } from "@faker-js/faker";
import mongoose, { Types } from "mongoose";

import { UserModel } from "../models/user.model";
import { PostModel } from "../models/post.model";
import { LikeModel } from "../models/like.model";
import { FollowModel } from "../models/follow.model";
import { CommentModel } from "../models/comment.model";
import { MediaModel } from "../models/media.model";
import { EPostType, EPostStatus } from "@/domain/post";
import { ECommonVisibility } from "@/domain/user-setting";
import { ECommentStatus } from "@/domain/comment";

// To run:
// npx ts-node src/infrastructure/database/seeds/insert-mock-data.ts

const MONGO_URI = "mongodb://localhost:27017/trendify";

// Adjust these constants to generate "tạo càng nhiều càng tốt" (as much as possible within reason)
const USERS_TO_FETCH = 2000;
const TOTAL_POSTS = 20_000;
const TOTAL_FOLLOWS = 30_000;
const TOTAL_LIKES = 50_000;
const TOTAL_COMMENTS = 20_000;
const BATCH_SIZE = 10_000;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("🚀 Mongo connected for seeding massive mock data...");

  // 1. Fetch seed users
  console.log(`📡 Fetching up to ${USERS_TO_FETCH} seed users...`);
  const users: any[] = await UserModel.find({}).limit(USERS_TO_FETCH).select("_id username firstName lastName").lean();
  
  if (users.length < 2) {
    console.error("❌ Not enough users in DB! Please run insert-user.ts first.");
    process.exit(1);
  }
  
  const userIds = users.map(u => u._id.toString());
  console.log(`✅ Loaded ${users.length} users acting as seeded actors.`);

  // Helpers
  const getRandomUser = () => users[Math.floor(Math.random() * users.length)];
  const getRandomUserId = () => userIds[Math.floor(Math.random() * userIds.length)];

  // 2. Clear old mock data if needed? We will just keep stacking it up!
  console.log("⚠️ Continuing to append data (No flush).");

  // ============================================================================
  // 3. GENERATE MEDIA (Fake S3 Media)
  // ============================================================================
  console.log("📸 Generating fake Media items...");
  const fakeMediaIds: Types.ObjectId[] = [];
  const mediaItems = [];
  for (let i = 0; i < 5000; i++) {
    const isVideo = Math.random() < 0.1; 
    const mediaId = new Types.ObjectId();
    fakeMediaIds.push(mediaId);

    mediaItems.push({
      _id: mediaId,
      ownerId: new Types.ObjectId(getRandomUserId()),
      key: `fake_seed_${mediaId}_${isVideo ? 'vid.mp4' : 'img.jpg'}`,
      mimeType: isVideo ? "video/mp4" : "image/jpeg",
      status: "processed", 
      size: fakerVI.number.int({ min: 50000, max: 2000000 }),
      metadata: { width: 800, height: 600 },
      variants: [
        {
          key: `fake_seed_${mediaId}_original_${isVideo ? 'vid.mp4' : 'img.jpg'}`,
          type: "original",
          width: 800, height: 600,
          format: isVideo ? "mp4" : "jpeg",
        }
      ]
    });
  }
  await MediaModel.insertMany(mediaItems, { lean: true });
  console.log(`✅ Inserted ${mediaItems.length} fake Media items.`);

  const getRandomMediaId = () => fakeMediaIds[Math.floor(Math.random() * fakeMediaIds.length)];

  // ============================================================================
  // 4. GENERATE POSTS
  // ============================================================================
  console.log(`📝 Generating ${TOTAL_POSTS} Posts...`);
  let postsInserted = 0;
  const createdPostIds: Types.ObjectId[] = [];
  
  // Track counters for bulk update later
  const postCounters = new Map<string, { likeCount: number, commentCount: number }>();

  while (postsInserted < TOTAL_POSTS) {
    const postBatch = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_POSTS - postsInserted);

    for (let i = 0; i < currentBatchSize; i++) {
      const postId = new Types.ObjectId();
      createdPostIds.push(postId);
      const author = getRandomUser();
      
      const typeRand = Math.random();
      const type = typeRand < 0.3 ? EPostType.IMAGE : typeRand < 0.4 ? EPostType.VIDEO : EPostType.TEXT;
      
      const mediaIds = [];
      if (type !== EPostType.TEXT) {
        mediaIds.push(getRandomMediaId());
        if (Math.random() > 0.8) mediaIds.push(getRandomMediaId()); // Multi-image
      }

      // Add #hashtags to content
      const baseContent = fakerVI.lorem.sentences({ min: 1, max: 3 });
      const hashtags = Array.from({ length: fakerVI.number.int({ min: 0, max: 3 }) })
        .map(() => `#${fakerVI.word.noun().replace(/\W/g, '')}`);
      
      const content = `${baseContent} ${hashtags.join(' ')}`;

      // Mentions
      const mentions = [];
      if (Math.random() > 0.8) {
        const mentionedUser = getRandomUser();
        mentions.push({
          userId: mentionedUser._id.toString(),
          username: mentionedUser.username || "unknown",
          startIndex: 0,
          endIndex: 10,
        });
      }

      postBatch.push({
        _id: postId,
        authorId: author._id,
        type,
        content,
        mediaIds,
        mentions,
        hashtags: [], // Will be auto-extracted by pre-save hook, OR we leave it empty if bulk inserting bypasses hooks.
        status: EPostStatus.ACTIVE,
        settings: {
          visibility: Math.random() > 0.1 ? ECommonVisibility.PUBLIC : ECommonVisibility.FOLLOWER,
          allowLike: true,
          allowComment: true,
        },
        counters: {
          likeCount: 0,
          commentCount: 0,
          viewCount: fakerVI.number.int({ min: 0, max: 500 }),
        },
        createdAt: fakerVI.date.recent({ days: 60 }),
      });

      postCounters.set(postId.toString(), { likeCount: 0, commentCount: 0 });
    }

    await PostModel.insertMany(postBatch, { lean: true });
    postsInserted += currentBatchSize;
    console.log(`   ... ${postsInserted}/${TOTAL_POSTS} posts`);
  }

  // ============================================================================
  // 5. GENERATE LIKES
  // ============================================================================
  console.log(`❤️ Generating ${TOTAL_LIKES} Likes...`);
  let likesInserted = 0;
  while (likesInserted < TOTAL_LIKES) {
    const likeBatch = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_LIKES - likesInserted);

    for (let i = 0; i < currentBatchSize; i++) {
      const postId = createdPostIds[Math.floor(Math.random() * createdPostIds.length)];
      const userId = getRandomUserId();

      likeBatch.push({
        userId: new Types.ObjectId(userId),
        targetId: postId,
        targetType: "post",
        createdAt: fakerVI.date.recent({ days: 30 }),
      });

      // Update counter map
      const counters = postCounters.get(postId.toString());
      if (counters) counters.likeCount++;
    }

    // Ignore duplicates gracefully
    await LikeModel.insertMany(likeBatch, { lean: true, ordered: false }).catch(err => {
      // duplicates throws code 11000
    });
    
    likesInserted += currentBatchSize;
    console.log(`   ... ${likesInserted}/${TOTAL_LIKES} likes`);
  }

  // ============================================================================
  // 6. GENERATE COMMENTS
  // ============================================================================
  console.log(`💬 Generating ${TOTAL_COMMENTS} Comments...`);
  let commentsInserted = 0;
  while (commentsInserted < TOTAL_COMMENTS) {
    const commentBatch = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_COMMENTS - commentsInserted);

    for (let i = 0; i < currentBatchSize; i++) {
      const postId = createdPostIds[Math.floor(Math.random() * createdPostIds.length)];
      const authorId = getRandomUserId();

      commentBatch.push({
        postId,
        authorId: new Types.ObjectId(authorId),
        content: fakerVI.lorem.sentence(),
        status: ECommentStatus.ACTIVE,
        counters: { replyCount: 0, likeCount: 0 },
        createdAt: fakerVI.date.recent({ days: 30 }),
      });

      // Update counter map
      const counters = postCounters.get(postId.toString());
      if (counters) counters.commentCount++;
    }

    await CommentModel.insertMany(commentBatch, { lean: true });
    commentsInserted += currentBatchSize;
    console.log(`   ... ${commentsInserted}/${TOTAL_COMMENTS} comments`);
  }

  // ============================================================================
  // 7. GENERATE FOLLOWS & PENDING REQUESTS
  // ============================================================================
  console.log(`👥 Generating ${TOTAL_FOLLOWS} Follow Relationships...`);
  let followsInserted = 0;
  const followUserCounters = new Map<string, { following: number, followers: number }>();
  users.forEach(u => followUserCounters.set(u._id.toString(), { following: 0, followers: 0 }));

  while (followsInserted < TOTAL_FOLLOWS) {
    const followBatch = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_FOLLOWS - followsInserted);

    for (let i = 0; i < currentBatchSize; i++) {
      const followerId = getRandomUserId();
      let followingId = getRandomUserId();
      while (followerId === followingId) followingId = getRandomUserId();

      const status = Math.random() > 0.2 ? "ACCEPTED" : "PENDING";

      followBatch.push({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
        status,
        createdAt: fakerVI.date.recent({ days: 90 }),
      });

      if (status === "ACCEPTED") {
        const followerCounters = followUserCounters.get(followerId);
        const followingCounters = followUserCounters.get(followingId);
        if (followerCounters) followerCounters.following++;
        if (followingCounters) followingCounters.followers++;
      }
    }

    await FollowModel.insertMany(followBatch, { lean: true, ordered: false }).catch(err => {
      // handle duplicate unique keys
    });
    
    followsInserted += currentBatchSize;
    console.log(`   ... ${followsInserted}/${TOTAL_FOLLOWS} follows`);
  }

  // ============================================================================
  // 8. BATCH UPDATE COUNTERS (Posts and Users)
  // ============================================================================
  console.log("🔄 Bulk updating Post counters...");
  const postBulkOps = [];
  for (const [pId, counters] of postCounters.entries()) {
    if (counters.likeCount > 0 || counters.commentCount > 0) {
      postBulkOps.push({
        updateOne: {
          filter: { _id: new Types.ObjectId(pId) },
          update: { 
            $set: { 
              "counters.likeCount": counters.likeCount,
              "counters.commentCount": counters.commentCount,
            } 
          }
        }
      });
    }
  }
  if (postBulkOps.length > 0) {
    await PostModel.bulkWrite(postBulkOps as any);
  }

  console.log("🔄 Bulk updating User follower/following counters...");
  const userBulkOps = [];
  for (const [uId, counters] of followUserCounters.entries()) {
    if (counters.followers > 0 || counters.following > 0) {
      userBulkOps.push({
        updateOne: {
          filter: { _id: new Types.ObjectId(uId) },
          update: { 
            $inc: { 
              "followerCount": counters.followers,
              "followingCount": counters.following,
            } 
          }
        }
      });
    }
  }
  if (userBulkOps.length > 0) {
    await UserModel.bulkWrite(userBulkOps as any);
  }

  console.log("🎉 All Seedings completed successfully!");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
