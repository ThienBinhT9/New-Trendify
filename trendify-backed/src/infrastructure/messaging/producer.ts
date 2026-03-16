import { v4 as uuidv4 } from "uuid";
import { connectionManager } from "./connection.manager";
import { getRoutingKey } from "@/domain/events";
import { IMessageProducer } from "@/application/services";

export class Producer implements IMessageProducer {
  private exchangeName = "app.events";

  async publish(
    messageType: any,
    data: any,
    options?: {
      priority?: number;
      expiration?: number;
      persistent?: boolean;
    },
  ): Promise<void> {
    const channel = connectionManager.getChannel();

    const message = {
      id: uuidv4(),
      type: messageType,
      timestamp: Date.now(),
      data,
    };

    const routingKey = getRoutingKey(messageType);

    const content = Buffer.from(JSON.stringify(message));

    const publishOptions = {
      persistent: options?.persistent ?? true, // Lưu vào disk
      priority: options?.priority ?? 0,
      expiration: options?.expiration?.toString(),
      contentType: "application/json",
      timestamp: message.timestamp,
      messageId: message.id,
    };

    try {
      const published = channel.publish(this.exchangeName, routingKey, content, publishOptions);
      if (!published) {
        // Channel buffer đầy, đợi 'drain' event
        await new Promise((resolve) => channel.once("drain", resolve));
      }
    } catch (error) {
      console.error(`❌ Failed to publish ${routingKey}:`, error);
      throw error;
    }
  }
}
