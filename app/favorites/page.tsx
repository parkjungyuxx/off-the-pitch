"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowDown } from "react-icons/io";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-client";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";

// TODO: 트윗 표시 기능 구현 시 사용
// const normalizeTwitterMediaUrl = (url?: string | null): string | undefined => {
//   if (!url) return undefined;
//   if (url.startsWith("https://pbs.twimg.com/media/") && !url.includes("?")) {
//     return `${url}?format=jpg&name=large`;
//   }
//   return url;
// };

// const formatRelativeTime = (iso: string): string => {
//   const now = Date.now();
//   const then = new Date(iso).getTime();
//   const diff = Math.max(0, Math.floor((now - then) / 1000));
//   if (diff < 60) return `${diff}s`;
//   const m = Math.floor(diff / 60);
//   if (m < 60) return `${m}m`;
//   const h = Math.floor(m / 60);
//   if (h < 24) return `${h}h`;
//   const d = Math.floor(h / 24);
//   return `${d}d`;
// };

export default function FavoritesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [followedJournalists, setFollowedJournalists] = useState<Set<string>>(
    new Set()
  );
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("favorites");
  const [tweets, setTweets] = useState<FeedPostProps[]>([]);
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
    const loadFollowedJournalistsTweets = async () => {
      try {
        setLoading(true);
        setError(null);

        // 팔로우한 기자 목록 가져오기
        const followedData = await getFollowedJournalists();
        if (followedData.data) {
          const handles = new Set(
            followedData.data.map((f) => f.journalist_handle)
          );
          setFollowedJournalists(handles);
        }

        // TODO: 팔로우한 기자들의 트윗을 가져오는 로직 구현
        // 1. 해당 기자들의 트윗만 필터링하여 가져오기
        // 2. 시간순으로 정렬

        // 임시로 빈 배열 설정
        setTweets([]);
      } catch {
        setError("피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    if (!checkingAuth) {
      loadFollowedJournalistsTweets();
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
        selectedLeague={null}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
                좋아요
              </h1>
              <div className="mt-1 flex justify-center">
                <div className="flex items-center justify-center size-6 rounded-full border border-[rgb(57,57,57)] bg-card">
                  <IoIosArrowDown className="size-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            {loading && (
              <p className="text-muted-foreground text-sm">로딩 중…</p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
            {!loading && !error && tweets.length === 0 && (
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
              tweets.length > 0 &&
              tweets.map((tweet, index) => {
                const id = `tweet-${index}`;
                const handle = tweet.handle;
                const isFollowing = followedJournalists.has(handle);

                return (
                  <FeedPost
                    key={id}
                    {...tweet}
                    isFavorited={isFollowing}
                    onToggleFavorite={() =>
                      toggleFavorite(handle, tweet.journalist)
                    }
                  />
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}
