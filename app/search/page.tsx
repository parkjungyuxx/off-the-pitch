"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

// 더미 데이터
const dummyJournalists = [
  {
    name: "Fabrizio Romano",
    username: "FabrizioRomano",
    profileImage: null,
    credibility: 1 as const,
  },
  {
    name: "David Ornstein",
    username: "David_Ornstein",
    profileImage: null,
    credibility: 1 as const,
  },
  {
    name: "James Ducker",
    username: "TelegraphDucker",
    profileImage: null,
    credibility: 2 as const,
  },
  {
    name: "Chris Wheatley",
    username: "ChrisWheatley",
    profileImage: null,
    credibility: 2 as const,
  },
  {
    name: "Sam Lee",
    username: "SamLee",
    profileImage: null,
    credibility: 3 as const,
  },
];

export default function SearchPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("search");

  const toggleFavorite = (username: string) => {
    setFavorites((prev) =>
      prev.includes(username)
        ? prev.filter((fav) => fav !== username)
        : [...prev, username]
    );
  };

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
                  className="pl-10 pr-10 h-12 rounded-2xl bg-background border border-[rgb(57,57,57)] focus-visible:border-[rgb(70,70,70)] focus-visible:border-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                추천 기자
              </h2>

              <div className="space-y-3">
                {dummyJournalists.map((journalist) => {
                  const isFavorited = favorites.includes(journalist.username);
                  return (
                    <div
                      key={journalist.username}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-all"
                    >
                      <div className="shrink-0">
                        <Image
                          src="/placeholder.svg"
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
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
