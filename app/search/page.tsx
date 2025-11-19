"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";

import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JournalistSkeletonList } from "@/components/search/journalist-skeleton-list";
import { useJournalistSearch } from "@/hooks/use-journalist-search";
import { cn } from "@/lib/utils";

function CredibilityIcon({ level }: { level: 1 | 2 | 3 }) {
  const icons = {
    1: "🌕", // Tier 1 - 보름달 (제일 공신력 높음)
    2: "🌓", // Tier 2 - 반달
    3: "🌒", // Tier 3 - 초승달 (제일 공신력 낮음)
  };

  return (
    <span className="text-lg leading-none" title={`Tier ${level}`}>
      {icons[level]}
    </span>
  );
}

export default function SearchPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("search");

  const {
    searchQuery,
    setSearchQuery,
    filteredJournalists,
    loading,
    error,
    favorites,
    toggleFavorite,
  } = useJournalistSearch();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => {
          setActiveMenu(menu);
        }}
        selectedLeague={null}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
                검색
              </h1>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-2xl bg-background border border-[rgb(57,57,57)] focus-visible:border-[rgb(70,70,70)] focus-visible:border-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                {searchQuery.trim() ? "검색 결과" : "추천 기자"}
              </h2>

              {error && !loading && (
                <p className="text-destructive text-sm mb-3">{error}</p>
              )}

              {loading ? (
                <JournalistSkeletonList />
              ) : filteredJournalists.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  검색 결과가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredJournalists.map((journalist) => {
                    const isFavorited = favorites.includes(journalist.username);
                    return (
                      <div
                        key={journalist.username}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-all"
                      >
                        <Link
                          href={`/journalists/${journalist.username}`}
                          className="flex items-center gap-4 flex-1 min-w-0"
                        >
                          <div className="shrink-0">
                            <Image
                              src={
                                journalist.profileImage || "/placeholder.svg"
                              }
                              alt={journalist.name}
                              width={56}
                              height={56}
                              className="rounded-full"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-card-foreground">
                                {journalist.name}
                              </span>
                              <CredibilityIcon level={journalist.credibility} />
                            </div>
                            <p className="text-muted-foreground text-sm">
                              @{journalist.username}
                            </p>
                          </div>
                        </Link>

                        <Button
                          onClick={() => toggleFavorite(journalist.username)}
                          size="sm"
                          variant={isFavorited ? "secondary" : "outline"}
                          className={cn(
                            "rounded-full px-4 h-8 text-xs font-medium transition-all border border-[rgb(57,57,57)] shrink-0",
                            isFavorited
                              ? "bg-[rgb(24,24,24)] text-white hover:bg-[rgb(24,24,24)]"
                              : "bg-white text-black hover:bg-white/90"
                          )}
                        >
                          {isFavorited ? "팔로잉" : "팔로우"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
