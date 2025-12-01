import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { fetchTweets, type Tweet } from "@/lib/tweets";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";
import { getDailySummary } from "@/lib/summarize";
import { useInfiniteScroll } from "@bongsik/infinite-scroll";
import { useVirtualList, type VirtualItem } from "@bongsik/virtual-list";
import {
  ITEMS_PER_PAGE,
  VIRTUAL_LIST_SPACING,
  VIRTUAL_LIST_DEFAULT_ITEM_HEIGHT,
  INFINITE_SCROLL_THRESHOLD,
} from "@/lib/constants";
import { filterTweetsByLeague } from "@/lib/league-filter";

export function useHomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [followedJournalists, setFollowedJournalists] = useState<Set<string>>(
    new Set()
  );
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleChatModalChange = (open: boolean) => {
    setIsChatModalOpen(open);
    if (!open) {
      setSummary("");
      setSummaryError(null);
    }
  };

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
    if (isChatModalOpen) {
      const fetchSummary = async () => {
        try {
          setIsLoadingSummary(true);
          setSummaryError(null);
          setSummary("");
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
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const tweetsData = await fetchTweets({
          limit: ITEMS_PER_PAGE,
        });

        setTweets(tweetsData.items);
        setNextCursor(tweetsData.pagination.nextCursor);
        setHasMore(tweetsData.pagination.hasMore);

        setLoading(false);

        const timeoutPromise = new Promise<{ data: null; error: string }>(
          (resolve) =>
            setTimeout(() => resolve({ data: null, error: "타임아웃" }), 5000)
        );

        const followedData = await Promise.race([
          getFollowedJournalists(),
          timeoutPromise,
        ]);

        if (followedData.data) {
          const handles = new Set(
            followedData.data.map((f) => f.journalist_handle)
          );
          setFollowedJournalists(handles);
        }
      } catch (error) {
        console.error("Load initial data error:", error);
        setError("피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setLoading(false);
      }
    };

    if (!checkingAuth) {
      loadInitialData();
    }
  }, [checkingAuth]);

  const fetchMoreTweets = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    try {
      setIsLoadingMore(true);

      const tweetsData = await fetchTweets({
        limit: ITEMS_PER_PAGE,
        beforeId: nextCursor,
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
    threshold: INFINITE_SCROLL_THRESHOLD,
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

  const filteredTweets = useMemo(() => {
    return filterTweetsByLeague(tweets, selectedLeague);
  }, [tweets, selectedLeague]);

  const { virtualItems, totalHeight } = useVirtualList({
    itemCount: filteredTweets.length,
    itemHeight: VIRTUAL_LIST_DEFAULT_ITEM_HEIGHT,
    itemSpacing: VIRTUAL_LIST_SPACING,
    measureItemHeight: true,
    scrollTarget: "window",
    containerRef: containerRef as React.RefObject<HTMLElement | null>,
    overscan: 5,
  });

  return {
    checkingAuth,
    followedJournalists,
    selectedLeague,
    setSelectedLeague,
    tweets: filteredTweets,
    loading,
    isLoadingMore,
    hasMore,
    error,
    containerRef,
    isChatModalOpen,
    setIsChatModalOpen: handleChatModalChange,
    summary,
    isLoadingSummary,
    summaryError,
    toggleFavorite,
    virtualItems,
    totalHeight,
    sentinelRef,
  };
}

