"use client";

import { useEffect, useMemo, useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeedPost } from "@/components/feed-post";
import { JournalistSkeletonList } from "@/components/search/journalist-skeleton-list";
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
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface JournalistPageProps {
  params: Promise<{
    username: string;
  }>;
}

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

const CredibilityIcon = ({ level }: { level: 1 | 2 | 3 }) => {
  const icons = {
    1: "🌕",
    2: "🌓",
    3: "🌒",
  };
  return (
    <span className="text-xl" title={`Tier ${level}`}>
      {icons[level]}
    </span>
  );
};

const ProfileSkeleton = ({ theme }: { theme: "light" | "dark" }) => (
  <Card
    className={cn(
      "p-6 rounded-2xl border bg-card",
      theme === "light" ? "border-gray-300" : "border-[rgb(57,57,57)]"
    )}
  >
    <div className="flex gap-4 items-start">
      <div className="size-20 rounded-full bg-white/10 animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="h-6 w-40 rounded-full bg-white/10 animate-pulse" />
        <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
        <div className="h-4 w-20 rounded-full bg-white/5 animate-pulse" />
      </div>
      <div className="h-9 w-24 rounded-full bg-white/10 animate-pulse" />
    </div>
  </Card>
);

export default function JournalistPage({ params }: JournalistPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
  >("search");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [profile, setProfile] = useState<JournalistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // 프로필 정보, 트윗 목록, 팔로우 상태를 병렬로 가져오기
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

        // 프로필 정보가 없어도 트윗 데이터가 있으면 프로필 생성
        if (profileData) {
          setProfile(profileData);
        } else if (tweetsData.items.length > 0) {
          // 트윗 데이터에서 프로필 정보 추출
          const firstTweet = tweetsData.items[0];
          const displayName =
            (firstTweet.author_name?.split("@")[0]?.trim() as string) ||
            firstTweet.author_name ||
            username;

          setProfile({
            username,
            name: displayName,
            profileImage: firstTweet.author_profile_image || null,
            credibility: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
            tweetCount: tweetsData.items.length, // 임시로 현재 로드된 수 사용
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
    run();
  }, [username]);

  // 프로필 정보가 없을 때 기본값
  const displayProfile = useMemo(() => {
    if (!profile) {
      return {
        name: username,
        avatar: "/placeholder.svg",
        credibility: 2 as 1 | 2 | 3,
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

  const mappedTweets = tweets.map((t) => ({
    tweetId: t.tweet_id,
    journalist:
      (t.author_name?.split("@")[0]?.trim() as string) || t.author_name,
    handle: `@${t.author_username}`,
    credibility: 2 as 1 | 2 | 3,
    content: t.tweet_text,
    images: (t.images ?? [])
      .map((url) => normalizeTwitterMediaUrl(url)!)
      .filter(Boolean),
    time: formatRelativeTime(t.created_at),
    link: t.url,
    avatar:
      normalizeTwitterMediaUrl(t.author_profile_image) || "/placeholder.svg",
  }));

  const toggleFavorite = async () => {
    if (!profile) return;

    // 낙관적 업데이트 (UI 먼저 업데이트)
    setIsFollowing((prev) => !prev);

    // Supabase에 저장
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => setActiveMenu(menu)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80">
            <div className="px-4 lg:px-6 py-6 flex items-center justify-center relative">
              <button
                onClick={() => router.back()}
                className="absolute left-4 lg:left-6 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="이전 페이지로 돌아가기"
              >
                <div className="flex items-center justify-center size-6 rounded-full border border-[rgb(57,57,57)] bg-card">
                  <IoIosArrowBack className="size-4 text-white" />
                </div>
              </button>
              <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
                {displayProfile.name}
              </h1>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            {loading ? (
              <ProfileSkeleton theme={theme} />
            ) : (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                <div className="flex items-start gap-4">
                  <Image
                    src={displayProfile.avatar}
                    alt={displayProfile.name}
                    width={72}
                    height={72}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-semibold text-card-foreground">
                        {displayProfile.name}
                      </h2>
                      <CredibilityIcon level={displayProfile.credibility} />
                    </div>
                    <p className="text-muted-foreground">@{username}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                      <div>
                        <span className="text-card-foreground font-semibold">
                          {displayProfile.tweetCount}
                        </span>{" "}
                        게시물
                      </div>
                    </div>
                  </div>
                  <Button
                    className={cn(
                      "rounded-full px-5 border",
                      theme === "light"
                        ? isFollowing
                          ? "bg-white text-black border-gray-300 hover:bg-white"
                          : "bg-black text-white border-black hover:bg-black/90"
                        : isFollowing
                        ? "bg-[rgb(24,24,24)] text-white border-[rgb(57,57,57)] hover:bg-[rgb(24,24,24)]"
                        : "bg-white text-black border-[rgb(57,57,57)] hover:bg-white/90"
                    )}
                    variant={isFollowing ? "secondary" : "outline"}
                    onClick={toggleFavorite}
                  >
                    {isFollowing ? "팔로잉" : "팔로우"}
                  </Button>
                </div>
              </Card>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            {loading ? (
              <JournalistSkeletonList count={3} />
            ) : mappedTweets.length === 0 ? (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card text-center text-muted-foreground">
                아직 게시된 트윗이 없습니다.
              </Card>
            ) : (
              mappedTweets.map((post) => (
                <FeedPost
                  key={post.tweetId}
                  journalist={post.journalist}
                  handle={post.handle}
                  credibility={post.credibility}
                  content={post.content}
                  images={post.images}
                  time={post.time}
                  link={post.link}
                  avatar={post.avatar}
                  showFollowButton={false}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
