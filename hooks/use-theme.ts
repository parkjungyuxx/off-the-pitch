import { useState, useEffect } from "react";

const THEME_STORAGE_KEY = "off-the-pitch-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 실행
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    
    // localStorage에 저장
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  return { theme, setTheme, mounted };
}

