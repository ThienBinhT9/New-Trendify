import amqp from "amqplib";
import type { Channel, Connection } from "amqplib";
import { rabbitMQConfig } from "@/infrastructure/configs/rabbitmq.config";

class ConnectionManager {
  private channel: Channel | null = null;
  private connection: Connection | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Tạo kết nối
      this.connection = await amqp.connect(rabbitMQConfig.url);

      // 2. Tạo channel (kênh giao tiếp với RabbitMQ)
      this.channel = await this.connection.createChannel();

      // 3. Setup exchanges
      for (const exchange of rabbitMQConfig.exchanges) {
        await this.channel.assertExchange(exchange.name, exchange.type, exchange.options);
      }

      // 4. Setup queues
      for (const queue of rabbitMQConfig.queues) {
        await this.channel.assertQueue(queue.name, queue.options);
      }

      // 5. Bind queues to exchanges
      for (const binding of rabbitMQConfig.bindings) {
        await this.channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
      }

      // 6. Setup error handlers
      this.setupErrorHandlers();

      this.isInitialized = true;

      console.log("✅ RabbitMQ Connected");
    } catch (error) {
      console.error("❌ Failed to initialize RabbitMQ:", error);
      throw error;
    }
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized. Call initialize() first.");
    }
    return this.channel;
  }

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error("RabbitMQ connection not initialized. Call initialize() first.");
    }
    return this.connection;
  }

  private setupErrorHandlers(): void {
    if (!this.connection) return;

    this.connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err);
    });

    this.connection.on("close", () => {
      console.warn("⚠️ RabbitMQ connection closed");
      this.isInitialized = false;
      this.connection = null;
      this.channel = null;
    });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("✅ RabbitMQ connection closed");
    } catch (error) {
      console.error("❌ Error closing RabbitMQ connection:", error);
    } finally {
      this.isInitialized = false;
      this.connection = null;
      this.channel = null;
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.connection !== null;
  }
}

export const connectionManager = new ConnectionManager();
