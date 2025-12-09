"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeedPost } from "@/components/feed-post";
import { JournalistSkeletonList } from "@/components/search/journalist-skeleton-list";
import { useTheme } from "@/hooks/use-theme";
import { useJournalistProfile } from "@/hooks/use-journalist-profile";
import { cn } from "@/lib/utils";

interface JournalistPageProps {
  params: Promise<{
    username: string;
  }>;
}

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

  const {
    displayProfile,
    tweets,
    loading,
    error,
    isFollowing,
    avatarError,
    setAvatarError,
    toggleFavorite,
  } = useJournalistProfile(username);

  const FALLBACK_AVATAR = "/placeholder-user.jpg";

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
                <div
                  className={cn(
                    "flex items-center justify-center size-6 rounded-full border hover:border-white/40 transition-colors",
                    theme === "light"
                      ? "border-gray-300 bg-card"
                      : "border-[rgb(57,57,57)] bg-card"
                  )}
                >
                  <IoIosArrowBack
                    className={cn(
                      "size-4 transition-transform",
                      theme === "light" ? "text-gray-700" : "text-white"
                    )}
                  />
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
              <Card className="p-6 rounded-2xl border border-border dark:border-[rgb(57,57,57)] bg-card">
                <div className="flex items-start gap-4">
                  <Image
                    src={
                      avatarError || !displayProfile.avatar
                        ? FALLBACK_AVATAR
                        : displayProfile.avatar
                    }
                    alt={displayProfile.name}
                    width={72}
                    height={72}
                    className="rounded-full"
                    onError={() => setAvatarError(true)}
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
            ) : tweets.length === 0 ? (
              <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card text-center text-muted-foreground">
                아직 게시된 트윗이 없습니다.
              </Card>
            ) : (
              tweets.map((post) => (
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
