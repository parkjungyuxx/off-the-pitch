import { useEffect, useMemo, useState, useOptimistic } from "react";
import { fetchTweets, type Tweet } from "@/lib/tweets";
import {
  fetchJournalistProfile,
  type JournalistProfile,
} from "@/lib/journalists";
import {
  followJournalist,
  unfollowJournalist,
  getFollowedJournalists,
} from "@/lib/follows";
import {
  normalizeTwitterMediaUrl,
  formatRelativeTime,
  getJournalistCredibility,
} from "@/lib/utils";

export interface MappedTweet {
  tweetId: string;
  journalist: string;
  handle: string;
  credibility: 1 | 2 | 3;
  content: string;
  images: string[];
  time: string;
  link: string;
  avatar: string;
}

export interface DisplayProfile {
  name: string;
  avatar: string;
  credibility: 1 | 2 | 3;
  tweetCount: number;
}

interface UseJournalistProfileReturn {
  profile: JournalistProfile | null;
  displayProfile: DisplayProfile;
  tweets: MappedTweet[];
  loading: boolean;
  error: string | null;
  isFollowing: boolean;
  avatarError: boolean;
  setAvatarError: (error: boolean) => void;
  toggleFavorite: () => Promise<void>;
}

export function useJournalistProfile(
  username: string
): UseJournalistProfileReturn {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [profile, setProfile] = useState<JournalistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseIsFollowing, setBaseIsFollowing] = useState<boolean>(false);
  const [isFollowing, addOptimisticFollow] = useOptimistic(
    baseIsFollowing,
    (currentState, optimisticValue: boolean) => optimisticValue
  );
  const [avatarError, setAvatarError] = useState<boolean>(false);

  useEffect(() => {
    const loadJournalistData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, tweetsData, followedData] = await Promise.all([
          fetchJournalistProfile(username),
          fetchTweets({
            limit: 20,
            journalists: [username],
          }),
          getFollowedJournalists(),
        ]);

        setTweets(tweetsData.items);

        if (followedData.data) {
          const handle = `@${username}`;
          const following = followedData.data.some(
            (f) => f.journalist_handle === handle
          );
          setBaseIsFollowing(following);
        }

        if (profileData) {
          setProfile(profileData);
        } else if (tweetsData.items.length > 0) {
          const firstTweet = tweetsData.items[0];
          const displayName =
            (firstTweet.author_name?.split("@")[0]?.trim() as string) ||
            firstTweet.author_name ||
            username;

          setProfile({
            username,
            name: displayName,
            profileImage: firstTweet.author_profile_image || null,
            credibility: getJournalistCredibility(username),
            tweetCount: tweetsData.items.length,
          });
        } else {
          setError("기자 정보를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error("[journalist page] fetch error", err);
        setError("기자 피드를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadJournalistData();
  }, [username]);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.profileImage, username]);

  const displayProfile = useMemo<DisplayProfile>(() => {
    if (!profile) {
      return {
        name: username,
        avatar: "/placeholder.svg",
        credibility: getJournalistCredibility(username),
        tweetCount: 0,
      };
    }
    return {
      name: profile.name,
      avatar:
        normalizeTwitterMediaUrl(profile.profileImage) || "/placeholder.svg",
      credibility: profile.credibility,
      tweetCount: profile.tweetCount,
    };
  }, [profile, username]);

  const mappedTweets = useMemo<MappedTweet[]>(() => {
    return tweets.map((t) => ({
      tweetId: t.tweet_id,
      journalist:
        (t.author_name?.split("@")[0]?.trim() as string) || t.author_name,
      handle: `@${t.author_username}`,
      credibility: getJournalistCredibility(t.author_username),
      content: t.tweet_text,
      images: (t.images ?? [])
        .map((url) => normalizeTwitterMediaUrl(url)!)
        .filter(Boolean),
      time: formatRelativeTime(t.created_at),
      link: t.url,
      avatar:
        normalizeTwitterMediaUrl(t.author_profile_image) || "/placeholder.svg",
    }));
  }, [tweets]);

  const toggleFavorite = async () => {
    if (!profile) return;

    const handle = `@${username}`;
    const newFollowingState = !isFollowing;

    addOptimisticFollow(newFollowingState);

    const result = isFollowing
      ? await unfollowJournalist(handle)
      : await followJournalist(handle, profile.name);

    if (result.success) {
      setBaseIsFollowing(newFollowingState);
    } else {
      console.error("Toggle follow error:", result.error);
      setError(`팔로우 실패: ${result.error}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  return {
    profile,
    displayProfile,
    tweets: mappedTweets,
    loading,
    error,
    isFollowing,
    avatarError,
    setAvatarError,
    toggleFavorite,
  };
}
