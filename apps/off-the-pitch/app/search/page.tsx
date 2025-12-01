"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JournalistSkeletonList } from "@/components/search/journalist-skeleton-list";
import { JournalistItem } from "@/components/search/journalist-item";
import { useJournalistSearch } from "@/hooks/use-journalist-search";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | null
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(menu) => {
          setActiveMenu(menu);
        }}
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
            <Card
              className={cn(
                "p-6 rounded-2xl border bg-card",
                theme === "light" ? "border-gray-300" : "border-[rgb(57,57,57)]"
              )}
            >
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-10 pr-10 h-12 rounded-2xl bg-background focus-visible:border-2 focus-visible:ring-0 focus-visible:ring-offset-0",
                    theme === "light"
                      ? "border-gray-300 focus-visible:border-gray-400"
                      : "border-[rgb(57,57,57)] focus-visible:border-[rgb(70,70,70)]"
                  )}
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
                      <JournalistItem
                        key={journalist.username}
                        journalist={journalist}
                        isFavorited={isFavorited}
                        onToggleFavorite={() =>
                          toggleFavorite(journalist.username, journalist.name)
                        }
                        theme={theme}
                      />
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
