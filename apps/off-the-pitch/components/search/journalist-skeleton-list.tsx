"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface JournalistSkeletonListProps {
  count?: number;
  className?: string;
}

const JournalistSkeletonCard = () => {
  const { theme } = useTheme();
  
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl border bg-white/5",
        theme === "light"
          ? "border-gray-300/60"
          : "border-[rgb(57,57,57)]/60"
      )}
    >
    <Skeleton className="size-14 rounded-full bg-white/10" />
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-4 w-36 rounded-full bg-white/10" />
      <Skeleton className="h-3 w-24 rounded-full bg-white/10" />
    </div>
    <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
  </div>
  );
};

export const JournalistSkeletonList = ({
  count = 5,
  className,
}: JournalistSkeletonListProps) => {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <JournalistSkeletonCard key={idx} />
      ))}
    </div>
  );
};
