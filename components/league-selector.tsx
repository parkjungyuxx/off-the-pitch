"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface LeagueSelectorProps {
  selectedLeague: string | null
  onSelectLeague: (league: string | null) => void
  onClose: () => void
}

const leagues = [
  { name: "Premier League", country: "England", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "La Liga", country: "Spain", emoji: "🇪🇸" },
  { name: "Serie A", country: "Italy", emoji: "🇮🇹" },
  { name: "Bundesliga", country: "Germany", emoji: "🇩🇪" },
  { name: "Ligue 1", country: "France", emoji: "🇫🇷" },
]

export function LeagueSelector({ selectedLeague, onSelectLeague, onClose }: LeagueSelectorProps) {
  return (
    <div className="border-b border-border bg-card rounded-2xl mx-4 lg:mx-0 mb-4">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">{"Select a League"}</h2>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
            <span className="sr-only">{"Close"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {leagues.map((league) => (
            <Card
              key={league.name}
              className={`p-4 cursor-pointer transition-all hover:bg-secondary/50 border-2 rounded-2xl ${
                selectedLeague === league.name ? "border-primary bg-primary/10" : "border-border"
              }`}
              onClick={() => onSelectLeague(league.name)}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{league.emoji}</span>
                <div>
                  <div className="font-semibold text-card-foreground text-sm">{league.name}</div>
                  <div className="text-muted-foreground text-xs">{league.country}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedLeague && (
          <Button variant="outline" className="w-full bg-transparent rounded-2xl" onClick={() => onSelectLeague(null)}>
            {"Clear Filter"}
          </Button>
        )}
      </div>
    </div>
  )
}
