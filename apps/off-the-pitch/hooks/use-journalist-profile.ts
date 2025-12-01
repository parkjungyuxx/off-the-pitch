import { useEffect, useMemo, useState } from "react";
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

/**
 * 기자 상세 페이지의 비즈니스 로직을 관리하는 훅
 */
export function useJournalistProfile(
  username: string
): UseJournalistProfileReturn {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [profile, setProfile] = useState<JournalistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  // 기자 데이터 가져오기
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

        // 팔로우 상태 확인
        if (followedData.data) {
          const handle = `@${username}`;
          setIsFollowing(
            followedData.data.some((f) => f.journalist_handle === handle)
          );
        }

        // 프로필 데이터 설정
        if (profileData) {
          setProfile(profileData);
        } else if (tweetsData.items.length > 0) {
          // 프로필이 없지만 트윗이 있는 경우 트윗에서 프로필 정보 추출
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

  // 프로필 이미지 변경 시 아바타 에러 리셋
  useEffect(() => {
    setAvatarError(false);
  }, [profile?.profileImage, username]);

  // 표시용 프로필 데이터 변환
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

  // 트윗 데이터 매핑
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

  // 팔로우/언팔로우 토글
  const toggleFavorite = async () => {
    if (!profile) return;

    // 낙관적 업데이트
    setIsFollowing((prev) => !prev);

    const handle = `@${username}`;
    const result = isFollowing
      ? await unfollowJournalist(handle)
      : await followJournalist(handle, profile.name);

    if (!result.success) {
      // 실패 시 롤백
      setIsFollowing((prev) => !prev);
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

