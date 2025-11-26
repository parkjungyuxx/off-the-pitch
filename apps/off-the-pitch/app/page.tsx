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
import { useInfiniteScroll } from "@bongsik/infinite-scroll";
import { useVirtualList, type VirtualItem } from "@bongsik/virtual-list";

// 임시 mock 데이터 (무한스크롤 및 리스트 가상화 테스트용)
const createMockTweet = (index: number): Tweet => ({
  tweet_id: `mock_tweet_${index}`,
  author_name: "Fabrizio Romano",
  author_username: "FabrizioRomano",
  author_profile_image:
    "https://pbs.twimg.com/profile_images/1649219006229082112/Q4JSUo7r_400x400.jpg",
  tweet_text:
    "🚨 EXCLUSIVE: Manchester United are preparing a new bid for the midfielder. Sources confirm negotiations are advancing. More to follow... #MUFC #TransferNews",
  images: ["https://pbs.twimg.com/media/FakeImage1.jpg?format=jpg&name=large"],
  videos: null,
  created_at: new Date(Date.now() - index * 60000).toISOString(), // 각 트윗마다 1분씩 차이
  url: `https://twitter.com/FabrizioRomano/status/mock_${index}`,
});

// Mock 데이터 300개 생성 (전체 데이터)
const MOCK_TWEETS: Tweet[] = Array.from({ length: 300 }, (_, i) =>
  createMockTweet(i + 1)
);

// 한 번에 로드할 아이템 수
const ITEMS_PER_PAGE = 20;
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
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
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

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 테스트를 위해 네트워크 지연 시뮬레이션 (1초)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 초기에는 첫 페이지만 로드
        const initialTweets = MOCK_TWEETS.slice(0, ITEMS_PER_PAGE);
        setTweets(initialTweets);
        setHasMore(MOCK_TWEETS.length > ITEMS_PER_PAGE);

        // 팔로우한 기자 목록은 여전히 로드 (팔로우 기능 테스트용)
        const followedData = await getFollowedJournalists();
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
      loadInitialData();
    }
  }, [checkingAuth]);

  // 추가 데이터 로드 함수
  const fetchMoreTweets = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      // 테스트를 위해 네트워크 지연 시뮬레이션 (1.5초)
      // 무한 스크롤 로딩 상태를 명확히 확인할 수 있도록 딜레이 증가
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const currentLength = tweets.length;
      const nextTweets = MOCK_TWEETS.slice(
        currentLength,
        currentLength + ITEMS_PER_PAGE
      );

      if (nextTweets.length > 0) {
        setTweets((prev) => [...prev, ...nextTweets]);
        setHasMore(currentLength + nextTweets.length < MOCK_TWEETS.length);
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

  // 무한 스크롤 훅 설정
  const { sentinelRef } = useInfiniteScroll({
    loadMore: fetchMoreTweets,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 200, // 하단 200px 전에 미리 로드
  });

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

  // 리스트 가상화 훅 설정
  // FeedPost의 평균 높이 + space-y-4 간격(16px) 포함
  // 실제 FeedPost 높이에 맞춰 조정 필요
  // 브라우저 개발자 도구로 실제 높이 확인 후 조정: 실제 높이 + 16px
  const ESTIMATED_ITEM_HEIGHT = 200 + 16; // 아이템 높이(200px) + 간격(16px) - 더 작게 조정

  const { virtualItems, totalHeight } = useVirtualList({
    itemCount: filteredTweets.length,
    itemHeight: ESTIMATED_ITEM_HEIGHT,
    scrollTarget: "window",
    overscan: 3, // 화면 밖에 3개 아이템 추가 렌더링
  });

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

          <div className="p-4 lg:p-6">
            {loading &&
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="mb-4">
                  <FeedPostSkeleton />
                </div>
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
            {!loading && !error && filteredTweets.length > 0 && (
              <div style={{ position: "relative", height: totalHeight }}>
                {virtualItems.map((virtualItem: VirtualItem) => {
                  const t = filteredTweets[virtualItem.index];
                  if (!t) return null;

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
                    <div
                      key={id}
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
                {/* 무한 스크롤 sentinel 및 로딩 인디케이터 */}
                <div
                  ref={sentinelRef}
                  style={{
                    position: "absolute",
                    top: totalHeight,
                    width: "100%",
                  }}
                >
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
