import { useEffect, useState, ReactNode } from "react";
import { Theme, ThemeProviderContext } from "./theme-provider.utils";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  // Check for ?theme= param in URL
  function getThemeFromQuery(): Theme | null {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme");
    if (theme === "dark" || theme === "light" || theme === "system") {
      return theme;
    }
    return null;
  }

  const [theme, setThemeState] = useState<Theme>(() => {
    const queryTheme = getThemeFromQuery();
    if (queryTheme) return queryTheme;
    const stored = localStorage.getItem(storageKey) as Theme | null;
    return stored || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    let applied: Theme = theme;
    if (theme === "system") {
      applied = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    root.classList.add(applied);
  }, [theme]);

  // If theme is set by query param, update localStorage
  useEffect(() => {
    const queryTheme = getThemeFromQuery();
    if (queryTheme) {
      localStorage.setItem(storageKey, queryTheme);
    }
  }, [storageKey]);

  const value = {
    theme,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setThemeState(t);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
