interface UseThemeToggleProps {
  theme: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

interface UseThemeToggleReturn {
  toggleTheme: () => void;
}

/**
 * 테마 전환 비즈니스 로직을 관리하는 훅
 */
export function useThemeToggle({
  theme,
  onThemeChange,
}: UseThemeToggleProps): UseThemeToggleReturn {
  const toggleTheme = () => {
    onThemeChange?.(theme === "dark" ? "light" : "dark");
  };

  return {
    toggleTheme,
  };
}

