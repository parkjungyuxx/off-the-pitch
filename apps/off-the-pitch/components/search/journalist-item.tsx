import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Journalist } from "@/hooks/use-journalist-search";

interface CredibilityIconProps {
  level: 1 | 2 | 3;
}

function CredibilityIcon({ level }: CredibilityIconProps) {
  const icons = {
    1: "🌕", // Tier 1 - 보름달 (제일 공신력 높음)
    2: "🌓", // Tier 2 - 반달
    3: "🌒", // Tier 3 - 초승달 (제일 공신력 낮음)
  };

  return (
    <span className="text-lg leading-none" title={`Tier ${level}`}>
      {icons[level]}
    </span>
  );
}

interface JournalistItemProps {
  journalist: Journalist;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  theme: "light" | "dark";
}

export function JournalistItem({
  journalist,
  isFavorited,
  onToggleFavorite,
  theme,
}: JournalistItemProps) {
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const FALLBACK_AVATAR = "/placeholder-user.jpg";

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-all">
      <Link
        href={`/journalists/${journalist.username}`}
        className="flex items-center gap-4 flex-1 min-w-0"
      >
        <div className="shrink-0">
          <Image
            src={
              avatarError || !journalist.profileImage || journalist.profileImage === null
                ? FALLBACK_AVATAR
                : journalist.profileImage
            }
            alt={journalist.name}
            width={56}
            height={56}
            className="rounded-full"
            onError={() => setAvatarError(true)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-card-foreground">
              {journalist.name}
            </span>
            <CredibilityIcon level={journalist.credibility} />
          </div>
          <p className="text-muted-foreground text-sm">
            @{journalist.username}
          </p>
        </div>
      </Link>

      <Button
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite();
        }}
        size="sm"
        variant={isFavorited ? "secondary" : "outline"}
        className={cn(
          "rounded-full px-4 h-8 text-xs font-medium transition-all border shrink-0",
          theme === "light"
            ? isFavorited
              ? "bg-white text-black border-gray-300 hover:bg-white"
              : "bg-black text-white border-black hover:bg-black/90"
            : isFavorited
              ? "bg-[rgb(24,24,24)] text-white border-[rgb(57,57,57)] hover:bg-[rgb(24,24,24)]"
              : "bg-white text-black border-[rgb(57,57,57)] hover:bg-white/90"
        )}
      >
        {isFavorited ? "팔로잉" : "팔로우"}
      </Button>
    </div>
  );
}

