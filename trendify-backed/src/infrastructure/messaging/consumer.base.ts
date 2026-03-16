import { Channel, ConsumeMessage } from "amqplib";
import { connectionManager } from "./connection.manager";
import { AppMessage } from "@/domain/events";

export type MessageHandler<T = unknown> = (data: T, message: ConsumeMessage) => Promise<void>;

export interface ConsumerConfig {
  queueName: string;
  prefetch?: number; // Số message xử lý đồng thời
  retryLimit?: number;
  retryDelay?: number;
}

export abstract class BaseConsumer {
  protected channel: Channel;
  protected handlers: Map<string, MessageHandler> = new Map();

  protected readonly queueName: string;
  protected readonly prefetch: number;

  protected consumerTag: string | null = null;

  constructor(protected config: ConsumerConfig) {
    this.queueName = config.queueName;
    this.prefetch = config.prefetch ?? 1;
    this.channel = connectionManager.getChannel();
  }

  protected abstract registerHandlers(): void;

  /**
   * Đăng ký handler cho message type
   */
  protected register<T>(messageType: string, handler: MessageHandler<T>): void {
    this.handlers.set(messageType, handler as MessageHandler);
  }

  async start(): Promise<void> {
    try {
      // Set prefetch (số message lấy từ queue cùng lúc)
      await this.channel.prefetch(this.prefetch);

      // Đăng ký handlers
      this.registerHandlers();

      // Bắt đầu consume
      const { consumerTag } = await this.channel.consume(
        this.queueName,
        async (message) => {
          if (message) await this.handleMessage(message);
        },
        {
          noAck: false, // Cần ACK thủ công
        },
      );

      this.consumerTag = consumerTag;
      console.log(`✅ Consumer started: ${this.queueName} (prefetch: ${this.prefetch})`);
    } catch (error) {
      console.error(`❌ Failed to start consumer ${this.queueName}:`, error);
      throw error;
    }
  }

  /**
   * Xử lý message
   */
  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. Parse message
      const content = msg.content.toString();
      const message: AppMessage = JSON.parse(content);

      // 2. Tìm handler
      const handler = this.handlers.get(message.type);

      if (!handler) {
        this.channel.ack(msg);
        return;
      }

      // 3. Chạy handler
      await handler(message.data, msg);

      // 4. ACK (xác nhận đã xử lý thành công)
      this.channel.ack(msg);

      const duration = Date.now() - startTime;
      console.log(`✅ Processed: ${message.type} in ${duration}ms`);
    } catch (error) {
      console.error(`❌ Error processing message:`, error);
      await this.handleError(msg);
    }
  }

  /**
   * Xử lý lỗi
   */
  private async handleError(msg: ConsumeMessage): Promise<void> {
    const retryCount = this.getRetryCount(msg);
    const retryLimit = this.config.retryLimit ?? 3;

    if (retryCount < retryLimit) {
      // Retry: NACK và requeue
      console.log(`🔄 Retry ${retryCount + 1}/${retryLimit}`);
      this.channel.nack(msg, false, true); // requeue = true
    } else {
      // Đã retry đủ số lần → Gửi tới Dead Letter Queue
      console.error(`💀 Message failed after ${retryLimit} retries, sending to DLQ`);
      this.channel.nack(msg, false, false); // requeue = false → tới DLX
    }
  }

  /**
   * Lấy số lần retry từ message headers
   */
  private getRetryCount(msg: ConsumeMessage): number {
    const deaths = msg.properties.headers?.["x-death"];
    if (!deaths || !Array.isArray(deaths)) return 0;
    return deaths[0]?.count ?? 0;
  }

  async stop(): Promise<void> {
    if (this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
      console.log(`🛑 Consumer stopped: ${this.queueName}`);
    }
  }
}

// **Giải thích Consumer:**
// ```
// Luồng xử lý message:
// 1. Consumer lắng nghe queue
// 2. RabbitMQ push message tới consumer
// 3. Consumer parse JSON → AppMessage object
// 4. Tìm handler tương ứng với message.type
// 5. Chạy handler
// 6. Nếu thành công → ACK (xóa message khỏi queue)
// 7. Nếu lỗi → NACK và retry hoặc gửi DLQ
