import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAppSelector } from "@/stores";
import { getStorageTokens } from "@/utils/storage.util";
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket";
import { SocketContext, type SocketContextValue } from "./socket-context.shared";

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [status, setStatus] = useState<SocketContextValue["status"]>("idle");
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;

    const socket = getSocket();

    const handleConnect = () => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("connected");
      setReconnectAttempts(0);
      setLastError(null);
    };

    const handleDisconnect = () => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("disconnected");
    };

    const handleReconnectAttempt = () => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("reconnecting");
      setReconnectAttempts((prev) => prev + 1);
    };

    const handleConnectError = (error: Error) => {
      if (!mountedRef.current) {
        return;
      }

      setStatus("error");
      setLastError(error.message || "Socket connection error");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);

    return () => {
      mountedRef.current = false;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
    };
  }, []);

  useEffect(() => {
    const token = getStorageTokens().accessToken;

    if (isAuthenticated && userId && token) {
      setStatus("connecting");
      connectSocket();
      return;
    }

    disconnectSocket(true);
    setStatus("disconnected");
    setReconnectAttempts(0);
    setLastError(null);
  }, [isAuthenticated, userId]);

  const value = useMemo<SocketContextValue>(
    () => ({
      status,
      reconnectAttempts,
      lastError,
      isConnected: status === "connected",
      connect: () => {
        setStatus("connecting");
        connectSocket();
      },
      disconnect: () => {
        disconnectSocket(true);
        setStatus("disconnected");
      },
    }),
    [lastError, reconnectAttempts, status],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export { SocketProvider };
