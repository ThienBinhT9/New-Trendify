import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

import routes from "@/interfaces/routes";
import connectMongoose from "@/config/mongoose.config";
import { notfound, error } from "@/interfaces/middlewares/error.middleware";
import { convertRequestCase } from "@/interfaces/middlewares/case.middleware";
import { consumerManager } from "@/infrastructure/messaging/consumer.manager";
import { connectionManager } from "@/infrastructure/messaging/connection.manager";

const app = express();
dotenv.config();

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors({ credentials: true, origin: process.env.URL_FORNT_END }));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(convertRequestCase);

// ============================================
// ROUTES
// ============================================
routes(app);

// ============================================
// ERROR HANDLING MIDDLEWARES
// ============================================
app.use(notfound);
app.use(error);

async function startServer() {
  try {
    // 1. Kết nối MongoDB
    connectMongoose();

    // 2. Kết nối RabbitMQ và setup exchanges/queues
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await connectionManager.initialize();

    // 3. Khởi động consumers
    await consumerManager.start();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 4. Khởi động Express server
    app.listen(process.env.DEV_APP_PORT, () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`✅ Server is running on port ${process.env.DEV_APP_PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API: http://localhost:${process.env.DEV_APP_PORT}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n\n⚠️  Received ${signal}, shutting down gracefully...`);

  try {
    // 1. Dừng consumers (hoàn thành messages đang xử lý)
    await consumerManager.stop();

    // 3. Đóng kết nối RabbitMQ
    await connectionManager.close();

    // 3. Đóng kết nối MongoDB
    // await disconnectMongoose();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Lắng nghe các shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Docker/Kubernetes
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // Nodemon restart

// Xử lý uncaught errors
process.on("uncaughtException", (error) => {
  console.error("\n❌ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// ============================================
// START APPLICATION
// ============================================
startServer();
