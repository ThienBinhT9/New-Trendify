import { useSyncExternalStore } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface SearchInputState {
  /** Giá trị đang gõ trong input (chưa submit) */
  inputValue: string;
  isFocused: boolean;
}

// ============================================================================
// STORE (chỉ giữ UI input state — q và tab sống trên URL)
// ============================================================================

let state: SearchInputState = {
  inputValue: "",
  isFocused: false,
};

const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const getSnapshot = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ============================================================================
// ACTIONS
// ============================================================================

export const setSearchInputValue = (value: string) => {
  state = { ...state, inputValue: value };
  emitChange();
};

export const setSearchFocused = (focused: boolean) => {
  state = { ...state, isFocused: focused };
  emitChange();
};

export const clearSearchInput = () => {
  state = { ...state, inputValue: "" };
  emitChange();
};

export const resetSearchStore = () => {
  state = { inputValue: "", isFocused: false };
  emitChange();
};

export const useSearchStore = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
