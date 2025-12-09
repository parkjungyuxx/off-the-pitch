interface UseThemeToggleProps {
  theme: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

interface UseThemeToggleReturn {
  toggleTheme: () => void;
}

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

