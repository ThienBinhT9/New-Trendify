import React, { createContext, useContext, useMemo } from "react";

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export interface IChatTheme {
  id: string;
  name: string;
  bubbleMine: string;
  bubbleOther: string;
  textMine: string;
  textOther: string;
  accent: string;
}

export const CHAT_THEMES: Record<string, IChatTheme> = {
  classic: {
    id: "classic",
    name: "Mặc định",
    bubbleMine: "#0084ff",
    bubbleOther: "#e4e6eb",
    textMine: "#ffffff",
    textOther: "#050505",
    accent: "#0084ff",
  },
  sunset: {
    id: "sunset",
    name: "Hoàng hôn",
    bubbleMine: "#ff6b6b",
    bubbleOther: "#fff3e6",
    textMine: "#ffffff",
    textOther: "#333333",
    accent: "#ff6b6b",
  },
  forest: {
    id: "forest",
    name: "Rừng xanh",
    bubbleMine: "#2d6a4f",
    bubbleOther: "#d8f3dc",
    textMine: "#ffffff",
    textOther: "#1b4332",
    accent: "#2d6a4f",
  },
  ocean: {
    id: "ocean",
    name: "Đại dương",
    bubbleMine: "#0077b6",
    bubbleOther: "#caf0f8",
    textMine: "#ffffff",
    textOther: "#03045e",
    accent: "#0077b6",
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    bubbleMine: "#7b2cbf",
    bubbleOther: "#f3e8ff",
    textMine: "#ffffff",
    textOther: "#3c096c",
    accent: "#7b2cbf",
  },
  rose: {
    id: "rose",
    name: "Hồng",
    bubbleMine: "#e63985",
    bubbleOther: "#fce4ec",
    textMine: "#ffffff",
    textOther: "#880e4f",
    accent: "#e63985",
  },
  midnight: {
    id: "midnight",
    name: "Nửa đêm",
    bubbleMine: "#6366f1",
    bubbleOther: "#e0e7ff",
    textMine: "#ffffff",
    textOther: "#312e81",
    accent: "#6366f1",
  },
  golden: {
    id: "golden",
    name: "Vàng kim",
    bubbleMine: "#d4a017",
    bubbleOther: "#fef9e7",
    textMine: "#ffffff",
    textOther: "#7d6608",
    accent: "#d4a017",
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

interface IChatThemeContext {
  theme: IChatTheme;
  themeId: string;
}

const ChatThemeContext = createContext<IChatThemeContext>({
  theme: CHAT_THEMES.classic,
  themeId: "classic",
});

export const useChatTheme = () => useContext(ChatThemeContext);

// ============================================================================
// PROVIDER
// ============================================================================

interface ChatThemeProviderProps {
  themeId?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ChatThemeProvider = ({
  themeId = "classic",
  children,
  className,
  style,
}: ChatThemeProviderProps) => {
  const theme = CHAT_THEMES[themeId] || CHAT_THEMES.classic;

  const value = useMemo(() => ({ theme, themeId }), [theme, themeId]);

  const cssVars = useMemo(
    () =>
      ({
        "--chat-bubble-mine": theme.bubbleMine,
        "--chat-bubble-other": theme.bubbleOther,
        "--chat-text-mine": theme.textMine,
        "--chat-text-other": theme.textOther,
        "--chat-accent": theme.accent,
      }) as React.CSSProperties,
    [theme],
  );

  return (
    <ChatThemeContext.Provider value={value}>
      <div className={className} style={{ ...cssVars, ...style }}>
        {children}
      </div>
    </ChatThemeContext.Provider>
  );
};
