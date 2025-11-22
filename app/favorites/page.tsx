"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("favorites");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const scrollRef = useDragScroll<HTMLDivElement>();

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
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  useEffect(() => {
    const loadFollowedJournalistsTweets = async () => {
      try {
        setLoading(true);
        setError(null);

        // 팔로우한 기자 목록 가져오기
        const followedData = await getFollowedJournalists();
        if (!followedData.data || followedData.data.length === 0) {
          setFollowedJournalists(new Set());
          setTweets([]);
          return;
        }

        const handles = new Set(
          followedData.data.map((f) => f.journalist_handle)
        );
        setFollowedJournalists(handles);

        // 팔로우한 기자들의 username 추출 (@ 제거)
        const journalistUsernames = followedData.data.map((f) =>
          f.journalist_handle.replace(/^@/, "")
        );

        // 팔로우한 기자들의 트윗만 가져오기
        const tweetsData = await fetchTweets({
          limit: 50,
          journalists: journalistUsernames,
        });

        setTweets(tweetsData.items);

        // 기자별 프로필 이미지 추출 (트윗에서 가져오기)
        const journalistMap = new Map<
          string,
          { handle: string; name: string; avatar: string }
        >();

        followedData.data.forEach((f) => {
          const handle = f.journalist_handle;
          const username = handle.replace(/^@/, "");
          // 해당 기자의 첫 번째 트윗에서 프로필 이미지 가져오기
          const journalistTweet = tweetsData.items.find(
            (t) => t.author_username === username
          );
          journalistMap.set(handle, {
            handle,
            name: f.journalist_name,
            avatar:
              normalizeTwitterMediaUrl(journalistTweet?.author_profile_image) ||
              `/api/placeholder/48/48`,
          });
        });

        setFollowedJournalistsList(Array.from(journalistMap.values()));
      } catch (err) {
        console.error("Load followed journalists tweets error:", err);
        setError("피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    if (!checkingAuth) {
      loadFollowedJournalistsTweets();
    }
  }, [checkingAuth]);

  // 선택된 기자에 따라 트윗 필터링
  const filteredTweets = useMemo(() => {
    if (!selectedJournalist) {
      return tweets;
    }
    return tweets.filter((t) => `@${t.author_username}` === selectedJournalist);
  }, [tweets, selectedJournalist]);

  const toggleFavorite = async (handle: string, journalistName: string) => {
    const isFollowing = followedJournalists.has(handle);

    // 낙관적 업데이트 (UI 먼저 업데이트)
    setFollowedJournalists((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(handle);
      } else {
        next.add(handle);
      }
      return next;
    });

    // Supabase에 저장
    const result = isFollowing
      ? await unfollowJournalist(handle)
      : await followJournalist(handle, journalistName);

    if (!result.success) {
      // 실패 시 롤백
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
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <JournalistAvatarSkeleton key={idx} />
                  ))
                ) : (
                  followedJournalistsList.map((journalist) => {
                  const isSelected = selectedJournalist === journalist.handle;
                  return (
                    <button
                      key={journalist.handle}
                      onClick={() =>
                        setSelectedJournalist(
                          isSelected ? null : journalist.handle
                        )
                      }
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
                        src={journalist.avatar}
                        alt={journalist.name}
                        width={isSelected ? 56 : 48}
                        height={isSelected ? 56 : 48}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    </button>
                  );
                  })
                )}
              </div>
            </div>
          )}

          <div className="p-4 lg:p-6 space-y-4">
            {loading &&
              Array.from({ length: 3 }).map((_, idx) => (
                <FeedPostSkeleton key={idx} />
              ))}
            {error && <p className="text-destructive text-sm">{error}</p>}
            {!loading &&
              !error &&
              filteredTweets.length === 0 &&
              tweets.length === 0 && (
                <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-sm text-center">
                      팔로우한 기자가 없습니다.
                      <br />
                      기자를 팔로우하면 여기에 트윗이 표시됩니다.
                    </p>
                  </div>
                </Card>
              )}
            {!loading &&
              !error &&
              filteredTweets.length === 0 &&
              tweets.length > 0 && (
                <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-sm text-center">
                      {selectedJournalist
                        ? "선택한 기자의 트윗이 없습니다."
                        : "트윗이 없습니다."}
                    </p>
                  </div>
                </Card>
              )}
            {!loading &&
              !error &&
              filteredTweets.length > 0 &&
              filteredTweets.map((t) => {
                const displayName =
                  (t.author_name?.split("@")[0]?.trim() as string) ||
                  t.author_name;
                const mapped: FeedPostProps = {
                  journalist: displayName,
                  handle: `@${t.author_username}`,
                  credibility: 2, // 기본값 (Tier 2)
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
                  <FeedPost
                    key={id}
                    {...mapped}
                    isFavorited={isFollowing}
                    onToggleFavorite={() => toggleFavorite(handle, displayName)}
                  />
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}
