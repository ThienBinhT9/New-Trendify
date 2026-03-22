import { BaseConsumer, ConsumerConfig } from "../consumer.base";
import {
  PostCommentMessage,
  PostLikeMessage,
  PostSaveMessage,
  ROUTING_KEYS,
  UserCountsUpdateMessage,
} from "@/domain/events";
import { MongoosePostRepository } from "@/infrastructure/database/repositories/post.repository.impl";
import { MongooseUserRepository } from "@/infrastructure/database/repositories/user.repository.impl";

export class CounterConsumer extends BaseConsumer {
  constructor() {
    const config: ConsumerConfig = {
      queueName: "counter.queue",
      prefetch: 10, // Xử lý 10 count updates đồng thời
      retryLimit: 3,
      retryDelay: 1000, // 1 second delay between retries
    };

    super(config);
  }

  protected registerHandlers(): void {
    // Register user counts handler
    this.register<UserCountsUpdateMessage["data"]>(
      ROUTING_KEYS.COUNTER_USER_COUNTS,
      this.handleUserCountsUpdate.bind(this),
    );

    // Register post counters handlers
    this.register<PostLikeMessage["data"]>(
      ROUTING_KEYS.COUNTER_POST_LIKE,
      this.handlePostLikeUpdate.bind(this),
    );

    this.register<PostCommentMessage["data"]>(
      ROUTING_KEYS.COUNTER_POST_COMMENT,
      this.handlePostCommentUpdate.bind(this),
    );

    this.register<PostSaveMessage["data"]>(
      ROUTING_KEYS.COUNTER_POST_SAVE,
      this.handlePostSaveUpdate.bind(this),
    );
  }

  /**
   * Handler: Update follower/following counts
   *
   * Uses batchIncrementCounts for optimal performance -
   * multiple user updates in a single bulkWrite operation
   */
  private async handleUserCountsUpdate(data: UserCountsUpdateMessage["data"]): Promise<void> {
    const { operations, source } = data;

    if (operations.length === 0) return;

    // Filter out operations with no changes
    const validOperations = operations.filter(
      (op) =>
        (op.followerDelta && op.followerDelta !== 0) ||
        (op.followingDelta && op.followingDelta !== 0),
    );

    if (validOperations.length === 0) return;

    const userRepository = new MongooseUserRepository();
    try {
      await userRepository.batchIncrementCounts(validOperations);

      // Log individual changes for debugging
      validOperations.forEach((op) => {
        const changes: string[] = [];
        if (op.followerDelta)
          changes.push(`followers: ${op.followerDelta > 0 ? "+" : ""}${op.followerDelta}`);
        if (op.followingDelta)
          changes.push(`following: ${op.followingDelta > 0 ? "+" : ""}${op.followingDelta}`);
        console.log(`   User ${op.userId}: ${changes.join(", ")}`);
      });
    } catch (error) {
      console.error(`❌ Failed to update counts for ${source}:`, error);
      throw error;
    }
  }

  private async handlePostLikeUpdate(data: PostLikeMessage["data"]): Promise<void> {
    const { postId, delta } = data;
    if (!delta) return;

    const postRepository = new MongoosePostRepository();

    try {
      await postRepository.incrementLikeCount(postId, delta);
      console.log(`   Post ${postId}: likeCount ${delta > 0 ? "+" : ""}${delta}`);
    } catch (error) {
      console.error(`❌ Failed to update likeCount for post ${postId}:`, error);
      throw error;
    }
  }

  private async handlePostCommentUpdate(data: PostCommentMessage["data"]): Promise<void> {
    const { postId, delta } = data;
    if (!delta) return;

    const postRepository = new MongoosePostRepository();

    try {
      await postRepository.incrementCommentCount(postId, delta);
      console.log(`   Post ${postId}: commentCount ${delta > 0 ? "+" : ""}${delta}`);
    } catch (error) {
      console.error(`❌ Failed to update commentCount for post ${postId}:`, error);
      throw error;
    }
  }

  private async handlePostSaveUpdate(data: PostSaveMessage["data"]): Promise<void> {
    const { postId, delta } = data;
    if (!delta) return;

    const postRepository = new MongoosePostRepository();

    try {
      await postRepository.incrementSaveCount(postId, delta);
      console.log(`   Post ${postId}: saveCount ${delta > 0 ? "+" : ""}${delta}`);
    } catch (error) {
      console.error(`❌ Failed to update saveCount for post ${postId}:`, error);
      throw error;
    }
  }
}
