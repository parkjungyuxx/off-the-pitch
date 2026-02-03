"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Languages, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useTranslate } from "@/hooks/use-translate";
import { cn } from "@/lib/utils";

export interface FeedPostProps {
  journalist: string;
  handle: string;
  credibility: 1 | 2 | 3;
  content: string;
  images?: string[] | null;
  time: string;
  link: string;
  avatar: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  showFollowButton?: boolean;
  onInteraction?: () => void;
}

export function FeedPost({
  journalist,
  handle,
  credibility,
  content,
  images,
  time,
  link,
  avatar,
  isFavorited = false,
  onToggleFavorite,
  showFollowButton = true,
  onInteraction,
}: FeedPostProps) {
  const { theme } = useTheme();
  const [failedImageIdx, setFailedImageIdx] = useState<Set<number>>(new Set());
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const FALLBACK_AVATAR = "/placeholder-user.jpg";

  const username = handle.replace(/^@/, "");

  const {
    isTranslated,
    translatedContent,
    isTranslating,
    translateError,
    translateMessage,
    handleTranslate,
  } = useTranslate({ originalText: content });

  return (
    <Card className="p-4 lg:p-6 rounded-2xl border border-border dark:border-[rgb(57,57,57)] bg-card hover:bg-card/80 transition-all cursor-pointer group shadow-lg hover:shadow-xl w-full max-w-full overflow-hidden">
      <div className="flex gap-3 lg:gap-4">
        {/* 프로필 이미지 */}
        <Link href={`/journalists/${username}`} className="shrink-0">
          <Image
            src={avatarError || !avatar ? FALLBACK_AVATAR : avatar}
            alt={journalist}
            width={48}
            height={48}
            className="rounded-full hover:opacity-80 transition-opacity size-10 lg:size-12"
            onError={() => setAvatarError(true)}
          />
        </Link>

        {/* 본문 영역 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <Link
                href={`/journalists/${username}`}
                className="font-semibold text-card-foreground hover:scale-[1.02] transition-transform inline-block"
                onClick={(e) => e.stopPropagation()}
              >
                {journalist}
              </Link>
              <CredibilityIcon level={credibility} />
              <Link
                href={`/journalists/${username}`}
                className="text-muted-foreground text-sm hover:scale-[1.03] transition-transform inline-block"
                onClick={(e) => e.stopPropagation()}
              >
                {handle}
              </Link>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-muted-foreground text-sm">{time}</span>
              {showFollowButton && onToggleFavorite && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                    onInteraction?.();
                  }}
                  size="sm"
                  variant={isFavorited ? "secondary" : "outline"}
                  className={cn(
                    "rounded-full px-4 h-8 text-xs font-medium transition-all border",
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
              )}
            </div>
          </div>

          <div
            className="text-card-foreground text-[15px] leading-relaxed mb-3"
            aria-live="polite"
            aria-atomic="true"
          >
            {translateError ? (
              <div className="text-destructive text-sm py-2">
                {translateError}
              </div>
            ) : isTranslating ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground animate-pulse">
                  {translateMessage}
                </p>
              </div>
            ) : (
              <p>{isTranslated ? translatedContent : content}</p>
            )}
          </div>

          {images && images.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 max-w-full overflow-hidden">
              {images.slice(0, 4).map((src, idx) => {
                if (!src || failedImageIdx.has(idx)) return null;
                return (
                  <div
                    key={idx}
                    className="w-full max-w-full overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={src}
                      alt={`${journalist} media ${idx + 1}`}
                      width={672}
                      height={400}
                      sizes="(max-width: 768px) calc(100vw - 3rem), 672px"
                      unoptimized
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto rounded-2xl object-cover bg-muted"
                      style={{ maxWidth: "100%", height: "auto" }}
                      onError={() => {
                        setFailedImageIdx((prev) => {
                          const next = new Set(prev);
                          next.add(idx);
                          return next;
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 text-xs text-muted-foreground transition-colors",
                "hover:bg-transparent",
                theme === "light"
                  ? "hover:text-gray-700"
                  : "hover:text-gray-300"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleTranslate();
                onInteraction?.();
              }}
              disabled={isTranslating}
              aria-label={isTranslated ? "원문 보기" : "번역 보기"}
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Languages className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isTranslating
                ? "번역 중..."
                : isTranslated
                ? "원문 보기"
                : "번역 보기"}
            </Button>

            <Link
              href={link}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span>원문 트윗 보기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CredibilityIcon({ level }: { level: 1 | 2 | 3 }) {
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
