"use client";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function JournalistAvatarSkeleton() {
  const { theme } = useTheme();
  
  return (
    <div
      className={cn(
        "shrink-0 rounded-full border-2 size-12 bg-muted animate-pulse",
        theme === "light"
          ? "border-gray-300"
          : "border-border"
      )}
    />
  );
}

