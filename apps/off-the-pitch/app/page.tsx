"use client";

import { useState } from "react";
import Image from "next/image";
import { IoIosArrowDown } from "react-icons/io";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { FeedPostSkeleton } from "@/components/feed-post-skeleton";
import { Card } from "@/components/ui/card";
import { LeagueSelector } from "@/components/league-selector";
import {
  cn,
  normalizeTwitterMediaUrl,
  formatRelativeTime,
  getJournalistCredibility,
} from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useHomePage } from "@/hooks/use-home-page";
import { useVirtualList, type VirtualItem } from "@bongsik/virtual-list";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, XIcon } from "lucide-react";

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("home");
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);

  const {
    checkingAuth,
    followedJournalists,
    selectedLeague,
    setSelectedLeague,
    tweets,
    loading,
    isLoadingMore,
    hasMore,
    error,
    containerRef,
    isChatModalOpen,
    setIsChatModalOpen,
    summary,
    isLoadingSummary,
    summaryError,
    toggleFavorite,
    virtualItems,
    totalHeight,
    sentinelRef,
  } = useHomePage();

  if (checkingAuth) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => {
          setActiveMenu(menu);
        }}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20 w-full overflow-x-hidden">
        <div className="max-w-2xl mx-auto w-full">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
                오프 더 피치
              </h1>
              <div className="mt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeagueSelector((prev) => !prev)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
                  aria-expanded={showLeagueSelector}
                  aria-controls="league-selector"
                  aria-label="리그 선택 열기"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-7 rounded-full border hover:border-white/40 transition-colors",
                      theme === "light"
                        ? "border-gray-300 bg-card"
                        : "border-[rgb(57,57,57)] bg-card"
                    )}
                  >
                    <IoIosArrowDown
                      className={cn(
                        "size-4 transition-transform",
                        theme === "light" ? "text-gray-700" : "text-white",
                        showLeagueSelector && "rotate-180"
                      )}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div
            id="league-selector"
            className={cn(
              "px-4 lg:px-6 transition-all duration-300 ease-out overflow-hidden origin-top",
              showLeagueSelector
                ? "max-h-[520px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-3 pointer-events-none"
            )}
            aria-hidden={!showLeagueSelector}
          >
            <div className="py-2">
              <LeagueSelector
                selectedLeague={selectedLeague}
                onSelectLeague={(league) => {
                  setSelectedLeague(league);
                  setShowLeagueSelector(false);
                }}
              />
            </div>
          </div>

          <div className="p-4 lg:p-6">
            {loading &&
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="mb-4">
                  <FeedPostSkeleton />
                </div>
              ))}
            {error && <p className="text-destructive text-sm">{error}</p>}
            {!loading && !error && tweets.length === 0 && (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-sm text-center">
                    {selectedLeague
                      ? "해당 리그의 피드가 없습니다."
                      : "피드가 없습니다."}
                  </p>
                </div>
              </Card>
            )}
            {!loading && !error && tweets.length > 0 && (
              <div
                ref={containerRef}
                className="scrollbar-hide"
                style={{
                  position: "relative",
                  minHeight: totalHeight > 0 ? totalHeight : undefined,
                  overflow: "hidden",
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                {virtualItems.map((virtualItem: VirtualItem) => {
                  const t = tweets[virtualItem.index];
                  if (!t) return null;

                  const displayName =
                    (t.author_name?.split("@")[0]?.trim() as string) ||
                    t.author_name;
                  const mapped: FeedPostProps = {
                    journalist: displayName,
                    handle: `@${t.author_username}`,
                    credibility: getJournalistCredibility(t.author_username),
                    content: t.tweet_text,
                    images: (t.images ?? [])
                      .map((u) => normalizeTwitterMediaUrl(u)!)
                      .filter(Boolean),
                    time: formatRelativeTime(t.created_at),
                    link: t.url,
                    avatar:
                      normalizeTwitterMediaUrl(t.author_profile_image) ||
                      "/placeholder.svg",
                  };
                  const id = t.tweet_id;
                  const handle = `@${t.author_username}`;
                  const isFollowing = followedJournalists.has(handle);

                  return (
                    <div
                      key={`${id}-${virtualItem.index}`}
                      ref={virtualItem.ref}
                      className="mb-4"
                      style={{
                        position: "absolute",
                        top: virtualItem.start,
                        width: "100%",
                      }}
                    >
                      <FeedPost
                        {...mapped}
                        isFavorited={isFollowing}
                        onToggleFavorite={() =>
                          toggleFavorite(handle, displayName)
                        }
                        onInteraction={() => setShowLeagueSelector(false)}
                      />
                    </div>
                  );
                })}
                <div
                  style={{
                    height: totalHeight,
                    width: "100%",
                    pointerEvents: "none",
                  }}
                  aria-hidden="true"
                />
                <div ref={sentinelRef} className="py-4">
                  {isLoadingMore && (
                    <div className="space-y-4 py-4">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <FeedPostSkeleton key={`loading-skeleton-${idx}`} />
                      ))}
                    </div>
                  )}
                  {!hasMore && !isLoadingMore && tweets.length > 0 && (
                    <div className="py-4">
                      <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                        <div className="flex flex-col items-center justify-center py-8">
                          <p className="text-muted-foreground text-sm text-center">
                            모든 피드를 불러왔습니다.
                          </p>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <button
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg",
          "hover:scale-105 active:scale-95 transition-transform",
          "flex items-center justify-center",
          "bg-background border border-border",
          "hover:bg-sidebar-accent",
          "z-50"
        )}
        onClick={() => setIsChatModalOpen(true)}
        aria-label="오늘의 이적시장 요약"
      >
        <Image
          src="/summary-icon.svg"
          alt="AI 챗봇"
          width={28}
          height={28}
          className={cn("w-7 h-7", theme === "dark" && "invert")}
        />
      </button>

      <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "max-w-2xl h-[80vh] p-0 flex flex-col",
            theme === "light"
              ? "bg-white border-gray-300"
              : "bg-[#141414] border-[rgb(57,57,57)]"
          )}
        >
          <DialogHeader className="px-6 py-4 border-b border-border dark:border-[rgb(57,57,57)] relative">
            <div className="flex items-center gap-3">
              <Image
                src="/summary-icon.svg"
                alt="AI 챗봇"
                width={32}
                height={32}
                className={cn("w-8 h-8", theme === "dark" && "invert")}
              />
              <DialogTitle className="text-lg font-semibold">
                오늘의 이적시장 요약
              </DialogTitle>
            </div>
            <DialogClose
              className={cn(
                "absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100",
                "focus:outline-none focus:ring-0",
                "disabled:pointer-events-none"
              )}
            >
              <XIcon className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {isLoadingSummary ? (
              <div className="flex gap-3">
                <div className="shrink-0">
                  <Image
                    src="/summary-icon.svg"
                    alt="AI"
                    width={24}
                    height={24}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      theme === "dark" && "invert"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      theme === "light"
                        ? "bg-gray-100 text-gray-900"
                        : "bg-[#181818] text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        요약을 생성하고 있어요...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : summaryError ? (
              <div className="flex gap-3">
                <div className="shrink-0">
                  <Image
                    src="/summary-icon.svg"
                    alt="AI"
                    width={24}
                    height={24}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      theme === "dark" && "invert"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      theme === "light"
                        ? "bg-gray-100 text-gray-900"
                        : "bg-[#181818] text-white"
                    )}
                  >
                    <p className="text-sm text-destructive">{summaryError}</p>
                  </div>
                </div>
              </div>
            ) : summary ? (
              <div className="flex gap-3">
                <div className="shrink-0">
                  <Image
                    src="/summary-icon.svg"
                    alt="AI"
                    width={24}
                    height={24}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      theme === "dark" && "invert"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      theme === "light"
                        ? "bg-gray-100 text-gray-900"
                        : "bg-[#181818] text-white"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {summary}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
