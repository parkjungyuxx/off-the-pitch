"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowDown } from "react-icons/io";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { LeagueSelector } from "@/components/league-selector";
import { cn } from "@/lib/utils";
import { fetchTweets, type Tweet } from "@/lib/tweets";
import { createClient } from "@/lib/supabase-client";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";

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

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [followedJournalists, setFollowedJournalists] = useState<Set<string>>(
    new Set()
  );
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("home");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

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
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 트윗과 팔로우한 기자 목록을 동시에 로드
        const [tweetsData, followedData] = await Promise.all([
          fetchTweets({ limit: 20 }),
          getFollowedJournalists(),
        ]);

        setTweets(tweetsData.items);

        if (followedData.data) {
          const handles = new Set(
            followedData.data.map((f) => f.journalist_handle)
          );
          setFollowedJournalists(handles);
        }
      } catch {
        setError("피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    if (!checkingAuth) {
      loadData();
    }
  }, [checkingAuth]);

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
      // 에러 메시지 3초 후 자동 제거
      setTimeout(() => setError(null), 3000);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground text-sm">로딩 중…</p>
      </div>
    );
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

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
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
                  <div className="flex items-center justify-center size-7 rounded-full border border-[rgb(57,57,57)] bg-card hover:border-white/40 transition-colors">
                    <IoIosArrowDown
                      className={cn(
                        "size-4 text-white transition-transform",
                        showLeagueSelector && "rotate-180"
                      )}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {showLeagueSelector && (
            <div
              id="league-selector"
              className="px-4 lg:px-6"
              aria-hidden={!showLeagueSelector}
            >
              <div className="py-2">
                <LeagueSelector
                  selectedLeague={selectedLeague}
                  onSelectLeague={(league) => {
                    setSelectedLeague(league);
                    setShowLeagueSelector(false);
                  }}
                  onClose={() => setShowLeagueSelector(false)}
                />
              </div>
            </div>
          )}

          <div className="p-4 lg:p-6 space-y-4">
            {loading && (
              <p className="text-muted-foreground text-sm">로딩 중…</p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
            {!loading &&
              !error &&
              tweets.map((t) => {
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
