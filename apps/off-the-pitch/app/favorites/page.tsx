"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { FeedPostSkeleton } from "@/components/feed-post-skeleton";
import { JournalistAvatarSkeleton } from "@/components/journalist-avatar-skeleton";
import { JournalistAvatarButton } from "@/components/favorites/journalist-avatar-button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { useFavorites } from "@/hooks/use-favorites";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import {
  normalizeTwitterMediaUrl,
  formatRelativeTime,
  getJournalistCredibility,
} from "@/lib/utils";
import type { VirtualItem } from "@bongsik/virtual-list";

export default function FavoritesPage() {
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("favorites");

  const {
    followedJournalists,
    followedJournalistsList,
    selectedJournalist,
    tweets,
    filteredTweets,
    loading,
    isLoadingMore,
    hasMore,
    error,
    checkingAuth,
    virtualItems,
    totalHeight,
    setSelectedJournalist,
    toggleFavorite,
    sentinelRef,
    containerRef,
  } = useFavorites();

  const scrollRef = useDragScroll<HTMLDivElement>();

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
                좋아요
              </h1>
            </div>
          </div>

          {(loading || followedJournalistsList.length > 0) && (
            <div className="px-4 lg:px-6 pt-4 pb-2 min-w-0 overflow-hidden">
              <div
                ref={scrollRef}
                className="flex items-center gap-3 overflow-x-auto scrollbar-hide"
              >
                {loading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <JournalistAvatarSkeleton key={idx} />
                    ))
                  : followedJournalistsList.map((journalist) => {
                      const isSelected =
                        selectedJournalist === journalist.handle;
                      return (
                        <JournalistAvatarButton
                          key={journalist.handle}
                          journalist={journalist}
                          isSelected={isSelected}
                          onSelect={() =>
                            setSelectedJournalist(
                              isSelected ? null : journalist.handle
                            )
                          }
                        />
                      );
                    })}
              </div>
            </div>
          )}

          <div className="p-4 lg:p-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="mb-4">
                  <FeedPostSkeleton />
                </div>
              ))
            ) : error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : filteredTweets.length === 0 && tweets.length === 0 ? (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-sm text-center">
                    팔로우한 기자가 없습니다.
                    <br />
                    기자를 팔로우하면 여기에 트윗이 표시됩니다.
                  </p>
                </div>
              </Card>
            ) : filteredTweets.length === 0 && tweets.length > 0 ? (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-sm text-center">
                    {selectedJournalist
                      ? "선택한 기자의 트윗이 없습니다."
                      : "트윗이 없습니다."}
                  </p>
                </div>
              </Card>
            ) : (
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
                  const t = filteredTweets[virtualItem.index];
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
                      "/placeholder-user.jpg",
                  };
                  const id = t.tweet_id;
                  const handle = `@${t.author_username}`;
                  const isFollowing = followedJournalists.has(handle);

                  return (
                    <div
                      key={id}
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
                  {!hasMore && !isLoadingMore && filteredTweets.length > 0 && (
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
    </div>
  );
}
