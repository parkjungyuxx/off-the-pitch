"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeedPost, type FeedPostProps } from "@/components/feed-post";
import { JournalistSkeletonList } from "@/components/search/journalist-skeleton-list";
import { fetchTweets, type Tweet } from "@/lib/tweets";

interface JournalistPageProps {
  params: {
    username: string;
  };
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

const ProfileSkeleton = () => (
  <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
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
  const username = decodeURIComponent(params.username);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("search");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
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
        const { items } = await fetchTweets({
          limit: 20,
          journalists: [username],
        });
        setTweets(items);
      } catch (err) {
        console.error("[journalist page] fetch error", err);
        setError("기자 피드를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [username]);

  const profile = useMemo(() => {
    if (tweets.length === 0) {
      return {
        name: username,
        avatar: "/placeholder.svg",
        credibility: 2 as 1 | 2 | 3,
      };
    }
    const first = tweets[0];
    const name =
      (first.author_name?.split("@")[0]?.trim() as string) ||
      first.author_name ||
      username;
    return {
      name,
      avatar:
        normalizeTwitterMediaUrl(first.author_profile_image) ||
        "/placeholder.svg",
      credibility: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
    };
  }, [tweets, username]);

  const mappedTweets: FeedPostProps[] = tweets.map((t) => ({
    journalist:
      (t.author_name?.split("@")[0]?.trim() as string) || t.author_name,
    handle: `@${t.author_username}`,
    credibility: 2,
    content: t.tweet_text,
    images: (t.images ?? [])
      .map((url) => normalizeTwitterMediaUrl(url)!)
      .filter(Boolean),
    time: formatRelativeTime(t.created_at),
    link: t.url,
    avatar:
      normalizeTwitterMediaUrl(t.author_profile_image) || "/placeholder.svg",
  }));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((val) => val !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => setActiveMenu(menu)}
        selectedLeague={null}
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
                {profile.name}
              </h1>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            {loading ? (
              <ProfileSkeleton />
            ) : (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
                <div className="flex items-start gap-4">
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={72}
                    height={72}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-semibold text-card-foreground">
                        {profile.name}
                      </h2>
                      <CredibilityIcon level={profile.credibility} />
                    </div>
                    <p className="text-muted-foreground">@{username}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                      <div>
                        <span className="text-card-foreground font-semibold">
                          {tweets.length}
                        </span>{" "}
                        게시물
                      </div>
                    </div>
                  </div>
                  <Button
                    className="rounded-full px-5"
                    variant={
                      favorites.includes(username) ? "secondary" : "outline"
                    }
                    onClick={() => toggleFavorite(username)}
                  >
                    {favorites.includes(username) ? "팔로잉" : "팔로우"}
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
              mappedTweets.map((post) => {
                const id = `${username}-${post.time}`;
                return (
                  <FeedPost
                    key={id}
                    {...post}
                    isFavorited={favorites.includes(id)}
                    onToggleFavorite={() => toggleFavorite(id)}
                  />
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
