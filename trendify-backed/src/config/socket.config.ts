import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import appConfig from "@/config/app.config";
import { JwtPayloadBase } from "@/application/services/jwt.service";
import { EPresenceStatus } from "@/application/services/presence.service";
import { RedisPresenceService } from "@/infrastructure/services/presence.service";
import { MongooseFollowRepository } from "@/infrastructure/database/repositories/follow.repository.impl";
import { MongooseSettingsRepository } from "@/infrastructure/database/repositories";

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

// ── Shared instances for presence ──
const presenceService = new RedisPresenceService();
const followRepo = new MongooseFollowRepository();
const settingsRepo = new MongooseSettingsRepository();

// ============================================================================
// PRESENCE BROADCAST
// ============================================================================

/**
 * Broadcast presence change chỉ tới followers đang có socket connected.
 *
 * Flow:
 * 1. Check user có bật showOnlineStatus không → nếu tắt, không broadcast
 * 2. Lấy danh sách follower IDs từ MongoDB
 * 3. Emit "presence:changed" tới từng follower room
 *    (Socket.IO tự skip room trống → không tốn thêm resource)
 */
async function broadcastPresenceChange(
  ioServer: SocketIOServer,
  userId: string,
  status: EPresenceStatus,
): Promise<void> {
  try {
    // 1. Privacy check — user có cho phép hiển thị trạng thái?
    const settings = await settingsRepo.findByUserId(userId);
    if (settings && !settings.shouldShowOnlineStatus()) {
      return; // User ẩn trạng thái → không broadcast
    }

    // 2. Lấy danh sách followers
    const followerIds = await followRepo.findAllFollowerIds(userId);
    if (followerIds.length === 0) return;

    // 3. Emit tới từng follower room
    const payload = {
      userId,
      status,
      lastSeen: Date.now(),
    };

    for (const followerId of followerIds) {
      ioServer.to(`user:${followerId}`).emit("presence:changed", payload);
    }
  } catch (error) {
    console.error(`❌ Presence broadcast failed for user ${userId}:`, error);
  }
}

// ============================================================================
// SOCKET INITIALIZATION
// ============================================================================

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
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;

    // Mỗi user join room riêng: `user:{userId}`
    // → Khi emit notification, chỉ cần emit tới room này
    // → Nếu user mở nhiều tab, tất cả đều nhận
    socket.join(`user:${userId}`);

    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    // ── Presence: mark online & broadcast to followers ──
    await presenceService.setOnline(userId, socket.id);
    broadcastPresenceChange(io!, userId, EPresenceStatus.ONLINE);

    // ------------------------------------------------------------------
    // Post room: client join khi xem post detail, leave khi rời
    // → Cho phép broadcast counter updates (like, comment) realtime
    // ------------------------------------------------------------------
    socket.on("post:join", (postId: string) => {
      if (typeof postId === "string" && postId.length > 0) {
        socket.join(`post:${postId}`);
      }
    });

    socket.on("post:leave", (postId: string) => {
      if (typeof postId === "string" && postId.length > 0) {
        socket.leave(`post:${postId}`);
      }
    });

    // ------------------------------------------------------------------
    // Presence: Heartbeat — client gửi mỗi 60s để renew TTL
    // ------------------------------------------------------------------
    socket.on("presence:heartbeat", async () => {
      try {
        await presenceService.refreshHeartbeat(userId, socket.id);
      } catch (error) {
        console.error(`❌ Heartbeat failed for ${userId}:`, error);
      }
    });

    // ------------------------------------------------------------------
    // Presence: Idle — client tab hidden hoặc không tương tác 5 phút
    // ------------------------------------------------------------------
    socket.on("presence:idle", async () => {
      try {
        await presenceService.setIdle(userId);
        broadcastPresenceChange(io!, userId, EPresenceStatus.IDLE);
      } catch (error) {
        console.error(`❌ Idle transition failed for ${userId}:`, error);
      }
    });

    // ------------------------------------------------------------------
    // Presence: Active — client quay lại hoạt động từ idle
    // ------------------------------------------------------------------
    socket.on("presence:active", async () => {
      try {
        await presenceService.setActive(userId);
        broadcastPresenceChange(io!, userId, EPresenceStatus.ONLINE);
      } catch (error) {
        console.error(`❌ Active transition failed for ${userId}:`, error);
      }
    });

    // ------------------------------------------------------------------
    // Chat: client joins conversation rooms to receive messages
    // ------------------------------------------------------------------
    socket.on("chat:join", (conversationIds: string[]) => {
      if (Array.isArray(conversationIds)) {
        for (const convId of conversationIds) {
          if (typeof convId === "string" && convId.length > 0) {
            socket.join(`conversation:${convId}`);
          }
        }
      }
    });

    socket.on("chat:typing", (payload: { conversationId: string }) => {
      if (typeof payload?.conversationId === "string") {
        socket.to(`conversation:${payload.conversationId}`).emit("chat:typing", {
          conversationId: payload.conversationId,
          userId,
          isTyping: true,
        });
      }
    });

    socket.on("chat:stop-typing", (payload: { conversationId: string }) => {
      if (typeof payload?.conversationId === "string") {
        socket.to(`conversation:${payload.conversationId}`).emit("chat:typing", {
          conversationId: payload.conversationId,
          userId,
          isTyping: false,
        });
      }
    });

    // ------------------------------------------------------------------
    // Disconnect: mark offline & broadcast nếu fully offline
    // ------------------------------------------------------------------
    socket.on("disconnect", async (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} (${reason})`);

      try {
        const fullyOffline = await presenceService.setOffline(userId, socket.id);
        if (fullyOffline) {
          broadcastPresenceChange(io!, userId, EPresenceStatus.OFFLINE);
        }
      } catch (error) {
        console.error(`❌ Disconnect handler failed for ${userId}:`, error);
      }
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
