import { useSyncExternalStore } from "react";

/**
 * Lightweight unread conversations tracker.
 *
 * Stores a Set of conversation IDs that have unread messages.
 * Uses useSyncExternalStore for React 18 concurrent-safe subscriptions.
 *
 * Rules:
 * - When a new message arrives for a conversation that is NOT active → mark unread
 * - When user opens/joins a conversation → mark as read
 * - On logout → clear all
 */

type Listener = () => void;

let unreadSet = new Set<string>();
const listeners = new Set<Listener>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => unreadSet;

// ---- Public API ----

export const markConversationUnread = (conversationId: string) => {
  if (unreadSet.has(conversationId)) return; // already marked
  unreadSet = new Set(unreadSet);
  unreadSet.add(conversationId);
  emitChange();
};

export const markConversationRead = (conversationId: string) => {
  if (!unreadSet.has(conversationId)) return; // already read
  unreadSet = new Set(unreadSet);
  unreadSet.delete(conversationId);
  emitChange();
};

export const clearAllUnread = () => {
  if (unreadSet.size === 0) return;
  unreadSet = new Set();
  emitChange();
};

// ---- React Hook ----

/**
 * Returns a Set of conversation IDs that have unread messages.
 * Re-renders when the set changes.
 */
export const useUnreadConversations = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Returns whether a specific conversation has unread messages.
 */
export const useIsConversationUnread = (conversationId: string) => {
  const unread = useUnreadConversations();
  return unread.has(conversationId);
};
