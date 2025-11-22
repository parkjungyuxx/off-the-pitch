"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IoIosArrowDown } from "react-icons/io";
import { Sidebar } from "@/components/sidebar";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { FeedPostSkeleton } from "@/components/feed-post-skeleton";
import { Card } from "@/components/ui/card";
import { LeagueSelector } from "@/components/league-selector";
import { cn } from "@/lib/utils";
import { fetchTweets, type Tweet } from "@/lib/tweets";
import { createClient } from "@/lib/supabase-client";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";
import { useTheme } from "@/hooks/use-theme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, XIcon } from "lucide-react";
import { getDailySummary } from "@/lib/summarize";

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
  Bundesliga: [
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

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [followedJournalists, setFollowedJournalists] = useState<Set<string>>(
    new Set()
  );
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("home");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

  // 모달 열릴 때 자동으로 요약 요청
  useEffect(() => {
    if (isChatModalOpen) {
      const fetchSummary = async () => {
        try {
          setIsLoadingSummary(true);
          setSummaryError(null);
          setSummary(""); // 이전 요약 초기화
          const result = await getDailySummary();
          setSummary(result);
        } catch (error) {
          console.error("Summary fetch error:", error);
          setSummaryError("요약을 가져오는 중 오류가 발생했습니다.");
        } finally {
          setIsLoadingSummary(false);
        }
      };

      fetchSummary();
    }
  }, [isChatModalOpen]);

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

  // 리그 선택에 따라 트윗 필터링
  const filteredTweets = useMemo(() => {
    if (!selectedLeague) {
      // 리그가 선택되지 않았으면 모든 트윗 반환
      return tweets;
    }

    // Others를 선택한 경우: 다른 모든 주요 리그 팀들을 제외
    if (selectedLeague === "Others") {
      // 모든 주요 리그의 팀 이름 수집
      const allMajorLeagueTeams: string[] = [];
      Object.keys(LEAGUE_TEAMS).forEach((league) => {
        if (league !== "Others") {
          allMajorLeagueTeams.push(...LEAGUE_TEAMS[league]);
        }
      });

      // 주요 리그 팀 이름이 포함되지 않은 트윗만 반환
      return tweets.filter((tweet) => {
        const tweetText = tweet.tweet_text.toLowerCase();
        return !allMajorLeagueTeams.some((team) =>
          tweetText.includes(team.toLowerCase())
        );
      });
    }

    // 특정 리그를 선택한 경우: 해당 리그의 팀 이름이 포함된 트윗만 필터링
    const teamNames = LEAGUE_TEAMS[selectedLeague] || [];
    if (teamNames.length === 0) {
      return tweets;
    }

    return tweets.filter((tweet) => {
      const tweetText = tweet.tweet_text.toLowerCase();
      return teamNames.some((team) => tweetText.includes(team.toLowerCase()));
    });
  }, [tweets, selectedLeague]);

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
                      "flex items-center justify-center size-7 rounded-full border bg-card hover:border-white/40 transition-colors",
                      theme === "light"
                        ? "border-gray-300"
                        : "border-[rgb(57,57,57)]"
                    )}
                  >
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

          <div className="p-4 lg:p-6 space-y-4">
            {loading &&
              Array.from({ length: 3 }).map((_, idx) => (
                <FeedPostSkeleton key={idx} />
              ))}
            {error && <p className="text-destructive text-sm">{error}</p>}
            {!loading && !error && filteredTweets.length === 0 && (
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

      {/* AI 챗봇 플로팅 버튼 */}
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

      {/* AI 챗봇 모달 */}
      <Dialog
        open={isChatModalOpen}
        onOpenChange={(open) => {
          setIsChatModalOpen(open);
          if (!open) {
            // 모달 닫을 때 상태 초기화
            setSummary("");
            setSummaryError(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={cn(
            "max-w-2xl h-[80vh] p-0 flex flex-col",
            theme === "light"
              ? "bg-white border-gray-300"
              : "bg-[#141414] border-[rgb(57,57,57)]"
          )}
        >
          {/* 채팅 헤더 */}
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
            {/* 커스텀 닫기 버튼 (주황색 보더 없음) */}
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

          {/* 채팅 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* 요약 메시지 */}
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
