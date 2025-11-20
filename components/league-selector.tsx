"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeagueSelectorProps {
  selectedLeague: string | null;
  onSelectLeague: (league: string | null) => void;
}

const leagues = [
  {
    name: "Premier League",
    displayName: "프리미어 리그",
    country: "잉글랜드",
    emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  },
  { name: "La Liga", displayName: "라리가", country: "스페인", emoji: "🇪🇸" },
  {
    name: "Serie A",
    displayName: "세리에 A",
    country: "이탈리아",
    emoji: "🇮🇹",
  },
  {
    name: "Bundesliga",
    displayName: "분데스리가",
    country: "독일",
    emoji: "🇩🇪",
  },
  { name: "Ligue 1", displayName: "리그 1", country: "프랑스", emoji: "🇫🇷" },
  { name: "Others", displayName: "기타", country: "기타 국가", emoji: "🌏" },
];

export function LeagueSelector({
  selectedLeague,
  onSelectLeague,
}: LeagueSelectorProps) {
  return (
    <div className="border-b border-border bg-card rounded-2xl mb-4">
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {"리그 선택"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {leagues.map((league) => (
            <Card
              key={league.name}
              className={cn(
                "p-4 cursor-pointer transition-all hover:bg-secondary/50 border-2 rounded-2xl",
                selectedLeague === league.name
                  ? "border-primary bg-primary/10"
                  : "border-border"
              )}
              onClick={() => onSelectLeague(league.name)}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{league.emoji}</span>
                <div>
                  <div className="font-semibold text-card-foreground text-sm">
                    {league.displayName}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {league.country}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="min-h-[40px]">
          <Button
            variant="outline"
            className={cn(
              "w-full bg-transparent rounded-2xl transition-all",
              selectedLeague
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none invisible"
            )}
            onClick={() => onSelectLeague(null)}
          >
            {"필터 초기화"}
          </Button>
        </div>
      </div>
    </div>
  );
}
