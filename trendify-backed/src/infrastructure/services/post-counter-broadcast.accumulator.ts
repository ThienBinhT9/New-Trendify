import { getIO } from "@/config/socket.config";
import { MongoosePostRepository } from "@/infrastructure/database/repositories/post.repository.impl";

/**
 * PostCounterBroadcastAccumulator — Singleton
 *
 * Gom các postId bị thay đổi counter (like/comment) trong 1 khoảng thời gian,
 * sau đó batch query DB lấy counter thực tế và broadcast 1 lần cho mỗi post.
 *
 * Tại sao dùng pattern này?
 * 1. Performance: 10,000 likes/phút → chỉ ~12 socket emissions/phút (mỗi 5s flush 1 lần)
 * 2. Accuracy: Query DB mỗi lần flush → luôn nhận giá trị chính xác (source of truth)
 * 3. Simplicity: Chỉ cần gom postId vào Set, không cần track delta
 *
 * Flow:
 *   CounterConsumer.handlePostLikeUpdate() → accumulator.mark(postId)
 *   CounterConsumer.handlePostCommentUpdate() → accumulator.mark(postId)
 *   ... (tích lũy trong 5s) ...
 *   Interval fires → flush() → batch query DB → broadcast to Socket rooms
 */

const DEFAULT_FLUSH_INTERVAL_MS = 5000;

export class PostCounterBroadcastAccumulator {
  private static instance: PostCounterBroadcastAccumulator | null = null;

  private readonly pendingPostIds: Set<string> = new Set();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  private constructor(private readonly flushIntervalMs: number) {}

  // ============================================================================
  // SINGLETON
  // ============================================================================

  static getInstance(flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS): PostCounterBroadcastAccumulator {
    if (!PostCounterBroadcastAccumulator.instance) {
      PostCounterBroadcastAccumulator.instance = new PostCounterBroadcastAccumulator(
        flushIntervalMs,
      );
    }

    return PostCounterBroadcastAccumulator.instance;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Đánh dấu 1 postId cần broadcast counter update.
   * Gọi bởi CounterConsumer sau khi increment like hoặc comment count.
   *
   * Nếu accumulator chưa start, tự động start interval.
   */
  mark(postId: string): void {
    this.pendingPostIds.add(postId);
    this.ensureRunning();
  }

  /**
   * Start flush interval. Idempotent — safe to call multiple times.
   */
  start(): void {
    this.ensureRunning();
  }

  /**
   * Stop flush interval and clear pending data.
   * Gọi khi app shutdown để tránh memory leak.
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.pendingPostIds.clear();
    PostCounterBroadcastAccumulator.instance = null;
  }

  // ============================================================================
  // INTERNAL
  // ============================================================================

  private ensureRunning(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);

    // Đừng block Node.js process exit vì interval này
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  private async flush(): Promise<void> {
    // Guard: skip nếu đang flush hoặc không có gì pending
    if (this.flushing || this.pendingPostIds.size === 0) return;

    this.flushing = true;

    // Snapshot + clear pending set trước khi async (tránh bị mất data nếu mark() gọi trong lúc flush)
    const postIds = [...this.pendingPostIds];
    this.pendingPostIds.clear();

    // Stop interval nếu không còn gì pending (lazy — chỉ chạy khi cần)
    // Interval sẽ restart khi mark() gọi lại
    if (this.pendingPostIds.size === 0 && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      const postRepo = new MongoosePostRepository();
      const results = await postRepo.getCountersByIds(postIds);

      const io = getIO();

      for (const { postId, counters } of results) {
        // Chỉ broadcast đến room `post:{postId}` — chỉ viewers đang xem post mới nhận
        io.to(`post:${postId}`).emit("post:counters-updated", {
          postId,
          likeCount: counters.likeCount,
          commentCount: counters.commentCount,
        });
      }

      if (results.length > 0) {
        console.log(
          `📡 Broadcast counters for ${results.length} post(s): ${postIds.join(", ")}`,
        );
      }
    } catch (error) {
      console.error("[PostCounterBroadcastAccumulator] Flush failed:", error);
      // Re-add failed postIds so they'll be retried on next flush
      for (const id of postIds) {
        this.pendingPostIds.add(id);
      }
      this.ensureRunning();
    } finally {
      this.flushing = false;
    }
  }
}
