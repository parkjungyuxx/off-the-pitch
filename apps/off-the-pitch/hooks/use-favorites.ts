import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";
import { fetchTweets, type Tweet } from "@/lib/tweets";
import { useInfiniteScroll } from "@bongsik/infinite-scroll";
import { useVirtualList, type VirtualItem } from "@bongsik/virtual-list";
import { normalizeTwitterMediaUrl } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";

export interface JournalistInfo {
  handle: string;
  name: string;
  avatar: string;
}

interface UseFavoritesReturn {
  // 상태
  followedJournalists: Set<string>;
  followedJournalistsList: JournalistInfo[];
  selectedJournalist: string | null;
  tweets: Tweet[];
  filteredTweets: Tweet[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  checkingAuth: boolean;
  virtualItems: VirtualItem[];
  totalHeight: number;
  // 액션
  setSelectedJournalist: (handle: string | null) => void;
  toggleFavorite: (handle: string, journalistName: string) => Promise<void>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 좋아요 페이지의 비즈니스 로직을 관리하는 훅
 */
export function useFavorites(): UseFavoritesReturn {
  const router = useRouter();
  const supabase = createClient();
  const [followedJournalists, setFollowedJournalists] = useState<Set<string>>(
    new Set()
  );
  const [followedJournalistsList, setFollowedJournalistsList] = useState<
    JournalistInfo[]
  >([]);
  const [selectedJournalist, setSelectedJournalist] = useState<string | null>(
    null
  );
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [journalistUsernames, setJournalistUsernames] = useState<string[]>([]);

  // 인증 체크
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

  // 초기 데이터 로드
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

        // 기자 정보 맵 생성
        const journalistMap = new Map<string, JournalistInfo>();

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

  // 더 많은 트윗 가져오기
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

  // 무한 스크롤 설정
  const { sentinelRef } = useInfiniteScroll({
    loadMore: fetchMoreTweets,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

  // 선택된 기자로 트윗 필터링
  const filteredTweets = useMemo(() => {
    if (!selectedJournalist) {
      return tweets;
    }
    return tweets.filter((t) => `@${t.author_username}` === selectedJournalist);
  }, [tweets, selectedJournalist]);

  // 가상화 리스트 설정
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

  // 팔로우/언팔로우 토글
  const toggleFavorite = async (handle: string, journalistName: string) => {
    const isFollowing = followedJournalists.has(handle);

    // 낙관적 업데이트
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

  return {
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
  };
}

