import { useEffect, useMemo, useRef, useState, useOptimistic } from "react";
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
  setSelectedJournalist: (handle: string | null) => void;
  toggleFavorite: (handle: string, journalistName: string) => Promise<void>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useFavorites(): UseFavoritesReturn {
  const router = useRouter();
  const supabase = createClient();
  const [baseFollowedJournalists, setBaseFollowedJournalists] = useState<
    Set<string>
  >(new Set());
  const [followedJournalists, addOptimisticFollow] = useOptimistic(
    baseFollowedJournalists,
    (
      currentState,
      optimisticValue: { handle: string; isFollowing: boolean }
    ) => {
      const next = new Set(currentState);
      if (optimisticValue.isFollowing) {
        next.add(optimisticValue.handle);
      } else {
        next.delete(optimisticValue.handle);
      }
      return next;
    }
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
          setBaseFollowedJournalists(new Set());
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
        setBaseFollowedJournalists(
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
    containerRef:
      containerRef as unknown as React.RefObject<HTMLElement | null>,
    overscan: 5,
  });

  const toggleFavorite = async (handle: string, journalistName: string) => {
    const isFollowing = followedJournalists.has(handle);
    const newFollowingState = !isFollowing;

    addOptimisticFollow({ handle, isFollowing: newFollowingState });

    const result = isFollowing
      ? await unfollowJournalist(handle)
      : await followJournalist(handle, journalistName);

    if (result.success) {
      setBaseFollowedJournalists((prev) => {
        const next = new Set(prev);
        if (newFollowingState) {
          next.add(handle);
        } else {
          next.delete(handle);
        }
        return next;
      });
    } else {
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
    sentinelRef: sentinelRef as React.RefObject<HTMLDivElement>,
    containerRef,
  };
}
