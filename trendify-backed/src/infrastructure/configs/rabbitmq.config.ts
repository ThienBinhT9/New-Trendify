export interface RabbitMQConfig {
  url: string;
  exchanges: {
    name: string;
    type: "direct" | "topic" | "headers" | "fanout";
    options?: {
      durable?: boolean;
      autoDelete?: boolean;
    };
  }[];
  queues: {
    name: string;
    options?: {
      durable?: boolean;
      exclusive?: boolean;
      autoDelete?: boolean;
      deadLetterExchange?: string;
      messageTtl?: number;
    };
  }[];
  bindings: {
    exchange: string;
    queue: string;
    routingKey: string;
  }[];
}

export const rabbitMQConfig: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  exchanges: [
    {
      name: "app.events",
      type: "topic",
      options: { durable: true },
    },
    {
      name: "app.dlx",
      type: "direct",
      options: { durable: true },
    },
  ],
  queues: [
    {
      name: "email.queue",
      options: {
        durable: true,
        deadLetterExchange: "app.dlx",
        messageTtl: 3600000,
      },
    },
    {
      name: "email.queue.dlx",
      options: {
        durable: true,
      },
    },
    {
      name: "counter.queue",
      options: {
        durable: true,
        deadLetterExchange: "app.dlx",
        messageTtl: 3600000, // 1 hour TTL
      },
    },
    {
      name: "counter.queue.dlx",
      options: {
        durable: true,
      },
    },
    {
      name: "media.queue",
      options: {
        durable: true,
        deadLetterExchange: "app.dlx",
        messageTtl: 3600000, // 1 hour TTL
      },
    },
    {
      name: "media.queue.dlx",
      options: {
        durable: true,
      },
    },
  ],
  bindings: [
    {
      exchange: "app.events",
      queue: "email.queue",
      routingKey: "email.*",
    },
    {
      exchange: "app.dlx",
      queue: "email.queue.dlx",
      routingKey: "email.queue",
    },
    {
      exchange: "app.events",
      queue: "counter.queue",
      routingKey: "counter.*",
    },
    {
      exchange: "app.dlx",
      queue: "counter.queue.dlx",
      routingKey: "counter.queue",
    },
    {
      exchange: "app.events",
      queue: "media.queue",
      routingKey: "media.*",
    },
    {
      exchange: "app.dlx",
      queue: "media.queue.dlx",
      routingKey: "media.queue",
    },
  ],
};

//**Giải thích cấu hình:**
// ```
// Exchange "app.events" (type: topic)
//         ├── routing key "email.*" -> email.queue
//         ├── routing key "notification.*" -> notification.queue
//         └── routing key "counter.*" -> counter.queue

// Khi Producer gửi message với routing key "email.welcome":
// → Exchange nhận message
// → Match pattern "email.*"
// → Routing tới email.queue
// → Consumer lấy từ email.queue và xử lý
