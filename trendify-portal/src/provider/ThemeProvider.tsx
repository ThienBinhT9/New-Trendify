import { EStorageContants, EThemeMode } from "@/interfaces/common.interface";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/storage.util";
import { ConfigProvider, theme, ThemeConfig, App } from "antd";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface ThemeContextType {
  themeMode: EThemeMode;
  darkMode: boolean; // resolved value (true = dark is active)
  setThemeMode: (mode: EThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const getSavedMode = (): EThemeMode => {
  const saved = getLocalStorageItem(EStorageContants.THEME_MODE) as EThemeMode;
  if (Object.values(EThemeMode).includes(saved)) return saved;

  return EThemeMode.LIGHT;
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<EThemeMode>(getSavedMode);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  // Listen for system preference changes (only affects AUTO mode)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const darkMode = useMemo(() => {
    if (themeMode === EThemeMode.AUTO) return systemDark;

    return themeMode === EThemeMode.DARK;
  }, [themeMode, systemDark]);

  const setThemeMode = (mode: EThemeMode) => {
    setThemeModeState(mode);
    setLocalStorageItem(EStorageContants.THEME_MODE, mode);
  };

  const themeConfig: ThemeConfig = useMemo(
    () => ({
      algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: "#aabb9e",
        colorBgContainer: darkMode ? "#1f1f1f" : "#ffffff",
        colorBgTextActive: "#ff5733",
      },
      components: {
        Menu: {
          itemSelectedBg: darkMode ? "#8d9e81" : "#aabb9e",
        },
        Dropdown: {
          colorBgElevated: darkMode ? "#2f2f2f" : "#fff",
        },
        Input: {
          colorText: darkMode ? "#ffffff" : "#191f23",
        },
        Tooltip: {
          colorText: darkMode ? "#191f23" : "#ffffff",
          colorBorder: darkMode ? "#555555" : "#d9d9d9",
          borderRadius: 12,
        },
        Notification: {
          colorBgElevated: darkMode ? "#ffffff" : "#2f2f2f",
          colorText: darkMode ? "#ffffff" : "#000000",
          colorTextHeading: darkMode ? "#ffffff" : "#000000",
        },
      },
    }),
    [darkMode],
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? EThemeMode.DARK : EThemeMode.LIGHT,
    );
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, darkMode, setThemeMode }}>
      <ConfigProvider theme={themeConfig}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme phải được sử dụng trong ThemeProvider");
  return context;
};

export default ThemeProvider;
