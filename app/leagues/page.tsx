"use client";

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { LeagueSelector } from "@/components/league-selector";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
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

// 리그별 팀 이름 목록
const LEAGUE_TEAMS: Record<string, string[]> = {
  "Premier League": [
    "Chelsea",
    "Tottenham",
    "Arsenal",
    "Manchester United",
    "Manchester City",
    "Liverpool",
    "Newcastle",
    "Brighton",
    "West Ham",
    "Aston Villa",
    "Crystal Palace",
    "Fulham",
    "Brentford",
    "Wolves",
    "Everton",
    "Nottingham Forest",
    "Burnley",
    "Sheffield United",
    "Luton",
    "Bournemouth",
  ],
  "La Liga": [
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Sevilla",
    "Real Sociedad",
    "Villarreal",
    "Real Betis",
    "Valencia",
    "Athletic Bilbao",
    "Getafe",
    "Osasuna",
    "Rayo Vallecano",
    "Celta Vigo",
    "Mallorca",
    "Las Palmas",
    "Alaves",
    "Cadiz",
    "Granada",
    "Almeria",
  ],
  "Serie A": [
    "Juventus",
    "AC Milan",
    "Inter Milan",
    "Napoli",
    "Atalanta",
    "Roma",
    "Lazio",
    "Fiorentina",
    "Bologna",
    "Torino",
    "Monza",
    "Genoa",
    "Lecce",
    "Frosinone",
    "Udinese",
    "Sassuolo",
    "Cagliari",
    "Verona",
    "Empoli",
    "Salernitana",
  ],
  "Bundesliga": [
    "Bayern Munich",
    "Borussia Dortmund",
    "RB Leipzig",
    "Bayer Leverkusen",
    "Eintracht Frankfurt",
    "Freiburg",
    "Hoffenheim",
    "Wolfsburg",
    "Augsburg",
    "Werder Bremen",
    "Bochum",
    "Union Berlin",
    "Mainz",
    "Cologne",
    "Darmstadt",
    "Heidenheim",
    "Gladbach",
    "Stuttgart",
  ],
  "Ligue 1": [
    "PSG",
    "Marseille",
    "Monaco",
    "Lyon",
    "Lille",
    "Nice",
    "Lens",
    "Rennes",
    "Reims",
    "Toulouse",
    "Montpellier",
    "Strasbourg",
    "Nantes",
    "Brest",
    "Le Havre",
    "Metz",
    "Lorient",
    "Clermont",
  ],
};

export default function LeaguesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("leagues");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

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
        // 리그 선택 여부와 관계없이 모든 트윗을 가져옴 (필터링은 클라이언트에서)
        const { items } = await fetchTweets({ limit: 100 });
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

  // 리그 선택에 따라 트윗 필터링
  const filteredTweets = useMemo(() => {
    if (!selectedLeague) {
      // 리그가 선택되지 않았으면 모든 트윗 반환
      return tweets;
    }

    const teamNames = LEAGUE_TEAMS[selectedLeague] || [];
    if (teamNames.length === 0) {
      return tweets;
    }

    // 트윗 본문에서 해당 리그의 팀 이름이 포함된 트윗만 필터링
    return tweets.filter((tweet) => {
      const tweetText = tweet.tweet_text.toLowerCase();
      return teamNames.some((team) =>
        tweetText.includes(team.toLowerCase())
      );
    });
  }, [tweets, selectedLeague]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => {
          setActiveMenu(menu);
        }}
        selectedLeague={selectedLeague}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
                리그
              </h1>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            <LeagueSelector
              selectedLeague={selectedLeague}
              onSelectLeague={(league) => {
                setSelectedLeague(league);
              }}
              onClose={() => {}}
            />

            {loading && (
              <p className="text-muted-foreground text-sm">로딩 중…</p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
            {!loading &&
              !error &&
              filteredTweets.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {selectedLeague
                    ? "해당 리그의 피드가 없습니다."
                    : "피드가 없습니다."}
                </p>
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

