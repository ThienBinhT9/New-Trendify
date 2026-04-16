import { useEffect, useRef, useState } from "react";

import { getSocket } from "@/services/socket";
import type { PostCountersUpdatedPayload } from "@/services/socket";

/**
 * usePostCounterSocket
 *
 * Hook cho PostDetailPage — quản lý socket room join/leave
 * và nhận realtime counter updates (likeCount + commentCount).
 *
 * Flow:
 * 1. Mount: emit `post:join` → server join socket vào room `post:{postId}`
 * 2. Listen `post:counters-updated` → cập nhật state khi server flush broadcast
 * 3. Unmount: emit `post:leave` → server rời room
 *
 * Trả về { likeCount, commentCount } hoặc null nếu chưa nhận update nào.
 * Component sử dụng hook này sẽ merge giá trị realtime với giá trị hiện tại
 * chỉ khi không đang optimistic mutating.
 */

export interface PostRealtimeCounters {
  likeCount: number;
  commentCount: number;
}

export function usePostCounterSocket(postId: string | undefined): PostRealtimeCounters | null {
  const [counters, setCounters] = useState<PostRealtimeCounters | null>(null);

  // Track postId để reset state khi navigate sang post khác
  const activePostIdRef = useRef<string | undefined>(postId);

  useEffect(() => {
    // Reset khi postId thay đổi
    if (activePostIdRef.current !== postId) {
      activePostIdRef.current = postId;
      setCounters(null);
    }

    if (!postId) return;

    const socket = getSocket();

    // Chỉ join room khi socket đã connect
    // Nếu chưa connect, join sẽ được thực hiện khi connect event fires
    const joinRoom = () => {
      socket.emit("post:join", postId);
    };

    const leaveRoom = () => {
      socket.emit("post:leave", postId);
    };

    const handleCountersUpdated = (payload: PostCountersUpdatedPayload) => {
      if (payload.postId !== postId) return;

      setCounters({
        likeCount: payload.likeCount,
        commentCount: payload.commentCount,
      });
    };

    // Nếu đã connect → join ngay
    if (socket.connected) {
      joinRoom();
    }

    // Khi connect/reconnect → join lại room
    socket.on("connect", joinRoom);
    socket.on("post:counters-updated", handleCountersUpdated);

    return () => {
      leaveRoom();
      socket.off("connect", joinRoom);
      socket.off("post:counters-updated", handleCountersUpdated);
    };
  }, [postId]);

  return counters;
}
