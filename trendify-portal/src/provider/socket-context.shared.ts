import { createContext, useContext } from "react";

import type { SocketConnectionStatus } from "@/services/socket";

interface SocketContextValue {
  status: SocketConnectionStatus;
  isConnected: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used inside SocketProvider");
  }

  return context;
};

export { SocketContext, useSocketContext };
export type { SocketContextValue };
