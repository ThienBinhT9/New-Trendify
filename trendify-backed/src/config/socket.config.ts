import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import appConfig from "@/config/app.config";
import { JwtPayloadBase } from "@/application/services/jwt.service";

/**
 * Socket.IO Server — Singleton
 *
 * Tại sao chọn Socket.IO thay vì SSE?
 * 1. Bidirectional: chuẩn bị cho chat feature sau này
 * 2. Auto-reconnect + fallback transport built-in
 * 3. Room system: mỗi user join room `user:{userId}` → emit chính xác đến đúng người
 * 4. Redis Adapter sẵn sàng cho scale multi-instance
 */

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: appConfig.frontendUrl,
      credentials: true,
    },
    // Chỉ dùng websocket, không fallback polling (performance)
    transports: ["websocket", "polling"],
  });

  // ============================================================================
  // JWT Authentication Middleware
  // ============================================================================
  // Xác thực token TRƯỚC KHI allow connection
  // → Chỉ user đã login mới nhận được notification
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = jwt.verify(token, appConfig.accessTokenSecret) as JwtPayloadBase;
      // Gắn userId vào socket data để dùng sau
      socket.data.userId = payload.sub;
      next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  // ============================================================================
  // Connection Handler
  // ============================================================================
  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    // Mỗi user join room riêng: `user:{userId}`
    // → Khi emit notification, chỉ cần emit tới room này
    // → Nếu user mở nhiều tab, tất cả đều nhận
    socket.join(`user:${userId}`);

    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} (${reason})`);
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
}

/**
 * Lấy Socket.IO instance từ bất kỳ đâu trong app.
 * Dùng trong NotificationConsumer để emit events.
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket() first.");
  }
  return io;
}
