import { createContext, useContext } from "react";

// ============================================================================
// PRESENCE TYPES
// ============================================================================

export type PresenceStatusType = "online" | "idle" | "offline";

export interface PresenceData {
  status: PresenceStatusType;
  lastSeen?: Date;
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface PresenceContextValue {
  /**
   * Get presence status for a user from in-memory cache.
   * Returns undefined if not yet loaded — caller should treat as "offline".
   */
  getPresence: (userId: string) => PresenceData | undefined;

  /**
   * Subscribe to presence updates for a list of user IDs.
   * Fetches initial data via REST API if not cached.
   * Returns unsubscribe function.
   */
  subscribe: (userIds: string[]) => () => void;

  /**
   * Version counter — incremented on every presence change.
   * Components use this to re-render when presence data changes.
   */
  version: number;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

const usePresenceContext = () => {
  const context = useContext(PresenceContext);

  if (!context) {
    throw new Error("usePresenceContext must be used inside PresenceProvider");
  }

  return context;
};

export { PresenceContext, usePresenceContext };
