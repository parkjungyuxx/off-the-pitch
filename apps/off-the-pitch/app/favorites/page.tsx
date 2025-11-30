"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { FeedPostSkeleton } from "@/components/feed-post-skeleton";
import { JournalistAvatarSkeleton } from "@/components/journalist-avatar-skeleton";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";
import { fetchTweets, type Tweet } from "@/lib/tweets";
import { useTheme } from "@/hooks/use-theme";
import { useInfiniteScroll } from "@bongsik/infinite-scroll";
import { useVirtualList, type VirtualItem } from "@bongsik/virtual-list";

const ITEMS_PER_PAGE = 20;

const normalizeTwitterMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("https://pbs.twimg.com/media/") && !url.includes("?")) {
    return `${url}?format=jpg&name=large`;
  }
  return url;
};

const formatRelativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

function JournalistAvatarButton({
  journalist,
  isSelected,
  onSelect,
}: {
  journalist: { handle: string; name: string; avatar: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
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
          avatarError || !journalist.avatar
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

export default function FavoritesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [followedJournalists, setFollowedJournalists] = useState<Set<string>>(
    new Set()
  );
  const [followedJournalistsList, setFollowedJournalistsList] = useState<
    Array<{ handle: string; name: string; avatar: string }>
  >([]);
  const [selectedJournalist, setSelectedJournalist] = useState<string | null>(
    null
  );
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("favorites");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const scrollRef = useDragScroll<HTMLDivElement>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [journalistUsernames, setJournalistUsernames] = useState<string[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Session check error:", error);
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, [router, supabase]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const followedData = await getFollowedJournalists();
        if (!followedData.data || followedData.data.length === 0) {
          setFollowedJournalists(new Set());
          setTweets([]);
          setFollowedJournalistsList([]);
          setHasMore(false);
          setNextCursor(null);
          setLoading(false);
          return;
        }

        const usernames = followedData.data.map((f) =>
          f.journalist_handle.replace(/^@/, "")
        );
        setJournalistUsernames(usernames);

        const tweetsData = await fetchTweets({
          limit: ITEMS_PER_PAGE,
          journalists: usernames,
        });

        setTweets(tweetsData.items);
        setNextCursor(tweetsData.pagination.nextCursor);
        setHasMore(tweetsData.pagination.hasMore);

        const journalistMap = new Map<
          string,
          { handle: string; name: string; avatar: string }
        >();

        followedData.data.forEach((f) => {
          const handle = f.journalist_handle;
          const username = handle.replace(/^@/, "");
          const journalistTweet = tweetsData.items.find(
            (t) => t.author_username === username
          );
          journalistMap.set(handle, {
            handle,
            name: f.journalist_name,
            avatar:
              normalizeTwitterMediaUrl(journalistTweet?.author_profile_image) ||
              "/placeholder-user.jpg",
          });
        });

        setFollowedJournalistsList(Array.from(journalistMap.values()));
        setFollowedJournalists(
          new Set(followedData.data.map((f) => f.journalist_handle))
        );
      } catch (err) {
        console.error("Load initial data error:", err);
        setError("피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    if (!checkingAuth) {
      loadInitialData();
    }
  }, [checkingAuth]);

  const fetchMoreTweets = async () => {
    if (
      isLoadingMore ||
      !hasMore ||
      !nextCursor ||
      journalistUsernames.length === 0
    )
      return;

    try {
      setIsLoadingMore(true);

      const tweetsData = await fetchTweets({
        limit: ITEMS_PER_PAGE,
        journalists: journalistUsernames,
        afterId: nextCursor,
      });

      if (tweetsData.items.length > 0) {
        setTweets((prev) => [...prev, ...tweetsData.items]);
        setNextCursor(tweetsData.pagination.nextCursor);
        setHasMore(tweetsData.pagination.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more tweets:", error);
      setError("추가 피드를 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const { sentinelRef } = useInfiniteScroll({
    loadMore: fetchMoreTweets,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

  const filteredTweets = useMemo(() => {
    if (!selectedJournalist) {
      return tweets;
    }
    return tweets.filter((t) => `@${t.author_username}` === selectedJournalist);
  }, [tweets, selectedJournalist]);

  const SPACING = 16;
  const DEFAULT_ITEM_HEIGHT = 200;

  const { virtualItems, totalHeight } = useVirtualList({
    itemCount: filteredTweets.length,
    itemHeight: DEFAULT_ITEM_HEIGHT,
    itemSpacing: SPACING,
    measureItemHeight: true,
    scrollTarget: "window",
    containerRef: containerRef as React.RefObject<HTMLElement | null>,
    overscan: 5,
  });

  const toggleFavorite = async (handle: string, journalistName: string) => {
    const isFollowing = followedJournalists.has(handle);

    setFollowedJournalists((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(handle);
      } else {
        next.add(handle);
      }
      return next;
    });

    const result = isFollowing
      ? await unfollowJournalist(handle)
      : await followJournalist(handle, journalistName);

    if (!result.success) {
      setFollowedJournalists((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(handle);
        } else {
          next.delete(handle);
        }
        return next;
      });
      console.error("Toggle follow error:", result.error);
      setError(`팔로우 실패: ${result.error}`);
      setTimeout(() => setError(null), 3000);
    }
  };

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
                    credibility: 2,
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
                  const isFirstItem = virtualItem.index === 0;

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
