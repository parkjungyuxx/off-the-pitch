"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { LeagueSelector } from "@/components/league-selector";
import { cn } from "@/lib/utils";
import { fetchTweets, type Tweet } from "@/lib/tweets";

const normalizeTwitterMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  // pbs.twimg.com 미디어 URL이면서 format 쿼리가 없으면 기본값을 추가합니다.
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
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("home");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await fetchTweets({ limit: 20 });
        setTweets(items);
      } catch {
        setError("피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => {
          setActiveMenu(menu);
          if (menu === "leagues") {
            setShowLeagueSelector(!showLeagueSelector);
          } else {
            setShowLeagueSelector(false);
          }
        }}
        selectedLeague={selectedLeague}
        showLeagueSelector={showLeagueSelector}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display tracking-wide text-balance">
                OFF THE PITCH
              </h1>
              <div className="min-h-[20px]">
                <p
                  className={cn(
                    "text-muted-foreground text-sm mt-1 transition-all",
                    selectedLeague ? "opacity-100" : "opacity-0 invisible"
                  )}
                >
                  {selectedLeague || "\u00A0"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            {showLeagueSelector && (
              <LeagueSelector
                selectedLeague={selectedLeague}
                onSelectLeague={(league) => {
                  setSelectedLeague(league);
                }}
                onClose={() => setShowLeagueSelector(false)}
              />
            )}
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
                  credibility: 4, // 기본값
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
                return (
                  <FeedPost
                    key={id}
                    {...mapped}
                    isFavorited={favorites.includes(id)}
                    onToggleFavorite={() => toggleFavorite(id)}
                  />
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}
