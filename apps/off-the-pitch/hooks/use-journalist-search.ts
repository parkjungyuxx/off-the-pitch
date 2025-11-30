import { useEffect, useMemo, useState } from "react";

import { fetchTweets, type Tweet } from "@/lib/tweets";
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

export interface Journalist {
  name: string;
  username: string;
  profileImage: string | null;
  credibility: 1 | 2 | 3;
}

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const useJournalistSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allJournalists, setAllJournalists] = useState<Journalist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadFollowedJournalists = async () => {
      try {
        const followedData = await getFollowedJournalists();
        if (followedData.data) {
          const handles = new Set(
            followedData.data.map((f) => f.journalist_handle.replace(/^@/, ""))
          );
          setFavorites(handles);
        }
      } catch (error) {
        console.error("Failed to load followed journalists:", error);
      }
    };

    loadFollowedJournalists();
  }, []);

  useEffect(() => {
    const fetchJournalists = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await fetchTweets({ limit: 100 });

        const journalistMap = new Map<string, Journalist>();

        items.forEach((tweet: Tweet) => {
          const username = tweet.author_username;
          if (journalistMap.has(username)) return;

          const displayName =
            (tweet.author_name?.split("@")[0]?.trim() as string) ||
            tweet.author_name;

          journalistMap.set(username, {
            name: displayName,
            username,
            profileImage:
              normalizeTwitterMediaUrl(tweet.author_profile_image) || null,
            credibility: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
          });
        });

        setAllJournalists(Array.from(journalistMap.values()));
      } catch (err) {
        console.error("[useJournalistSearch] fetch error", err);
        setError("기자 목록을 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchJournalists();
  }, []);

  const filteredJournalists = useMemo(() => {
    if (!searchQuery.trim()) {
      return shuffle(allJournalists).slice(0, 10);
    }

    const query = searchQuery.toLowerCase();
    return allJournalists.filter(
      (journalist) =>
        journalist.name.toLowerCase().includes(query) ||
        journalist.username.toLowerCase().includes(query),
    );
  }, [searchQuery, allJournalists]);

  const toggleFavorite = async (username: string, journalistName: string) => {
    const handle = `@${username}`;
    const isFollowing = favorites.has(username);

    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return next;
    });

    const result = isFollowing
      ? await unfollowJournalist(handle)
      : await followJournalist(handle, journalistName);

    if (!result.success) {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(username);
        } else {
          next.delete(username);
        }
        return next;
      });
      console.error("Toggle follow error:", result.error);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredJournalists,
    loading,
    error,
    favorites: Array.from(favorites),
    toggleFavorite,
  };
};

