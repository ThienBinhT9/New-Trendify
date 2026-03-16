import { BaseConsumer, ConsumerConfig } from "../consumer.base";
import { UserCountsUpdateMessage, ROUTING_KEYS } from "@/domain/events";
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

    // TODO: Register post counts handler
    // this.register<PostCountsUpdateMessage["data"]>(
    //   ROUTING_KEYS.COUNTER_POST_COUNTS,
    //   this.handlePostCountsUpdate.bind(this),
    // );
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
}
