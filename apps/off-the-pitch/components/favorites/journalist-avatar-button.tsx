import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface JournalistInfo {
  handle: string;
  name: string;
  avatar: string;
}

interface JournalistAvatarButtonProps {
  journalist: JournalistInfo;
  isSelected: boolean;
  onSelect: () => void;
}

export function JournalistAvatarButton({
  journalist,
  isSelected,
  onSelect,
}: JournalistAvatarButtonProps) {
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const FALLBACK_AVATAR = "/placeholder-user.jpg";

  return (
    <button
      key={journalist.handle}
      onClick={onSelect}
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        "shrink-0 rounded-full border-2 transition-all overflow-hidden select-none",
        isSelected
          ? "border-primary size-14"
          : "border-border size-12 hover:border-white/20"
      )}
      title={journalist.name}
    >
      <Image
        src={
          avatarError || !journalist.avatar || journalist.avatar === null
            ? FALLBACK_AVATAR
            : journalist.avatar
        }
        alt={journalist.name}
        width={isSelected ? 56 : 48}
        height={isSelected ? 56 : 48}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
        onError={() => setAvatarError(true)}
      />
    </button>
  );
}

