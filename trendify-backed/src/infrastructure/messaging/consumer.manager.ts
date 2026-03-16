import { BaseConsumer } from "./consumer.base";
import { EmailConsumer } from "./consumers/email.consumer";
import { CounterConsumer } from "./consumers/counter.consumer";
import { MediaConsumer } from "./consumers/media.consumer";

/**
 * Consumer Manager - Quản lý tất cả message consumers
 *
 * Organized by domain/function:
 * - EmailConsumer: Xử lý email events (password reset, welcome email, etc.)
 * - CounterConsumer: Xử lý count updates (user counts, post counts, etc.)
 * - NotificationConsumer: Xử lý notifications (future)
 * - AnalyticsConsumer: Xử lý analytics events (future)
 */
class ConsumerManager {
  private consumers: BaseConsumer[] = [];
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("⚠️ Consumers already running");
      return;
    }

    try {
      this.consumers = [new EmailConsumer(), new CounterConsumer(), new MediaConsumer()];

      // Start tất cả
      await Promise.all(this.consumers.map((c) => c.start()));

      this.isRunning = true;
    } catch (error) {
      console.error("❌ Failed to start consumers:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("🛑 Stopping consumers...");

    try {
      await Promise.all(this.consumers.map((c) => c.stop()));
      this.consumers = [];
      this.isRunning = false;
      console.log("✅ All consumers stopped");
    } catch (error) {
      console.error("❌ Error stopping consumers:", error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái
   */
  getStatus(): boolean {
    return this.isRunning;
  }
}

export const consumerManager = new ConsumerManager();
