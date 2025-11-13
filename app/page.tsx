"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { FeedPost } from "@/components/feed-post"
import { LeagueSelector } from "@/components/league-selector"

// Mock data for transfer news
const transferNews = [
  {
    id: 1,
    journalist: "Fabrizio Romano",
    handle: "@FabrizioRomano",
    credibility: 5,
    content:
      "🚨 BREAKING: Manchester United are in advanced talks with Bayern Munich for Harry Kane. Deal worth €100M + add-ons. Here we go! 🔴",
    time: "2m",
    link: "#",
    league: "Premier League",
    avatar: "/journalist-interview.png",
  },
  {
    id: 2,
    journalist: "David Ornstein",
    handle: "@David_Ornstein",
    credibility: 5,
    content:
      "Exclusive: Arsenal closing in on Declan Rice signing. Fee agreed at £105M. Medical scheduled for next week. #AFC",
    time: "15m",
    link: "#",
    league: "Premier League",
    avatar: "/sports-reporter.jpg",
  },
  {
    id: 3,
    journalist: "Gianluca Di Marzio",
    handle: "@DiMarzio",
    credibility: 4,
    content:
      "Inter Milan have made their first offer for Marcus Thuram. Negotiations ongoing with Borussia Mönchengladbach. 🔵⚫",
    time: "32m",
    link: "#",
    league: "Serie A",
    avatar: "/italian-journalist.jpg",
  },
  {
    id: 4,
    journalist: "Matteo Moretto",
    handle: "@MatteMoretto",
    credibility: 4,
    content: "Barcelona are preparing a new proposal for Bernardo Silva. Manchester City want €80M. Talks continue.",
    time: "1h",
    link: "#",
    league: "La Liga",
    avatar: "/spanish-reporter.jpg",
  },
  {
    id: 5,
    journalist: "Florian Plettenberg",
    handle: "@Plettigoal",
    credibility: 4,
    content: "NEWS: Bayern Munich have submitted an official bid for Randal Kolo Muani. PSG considering the offer. 🔴",
    time: "2h",
    link: "#",
    league: "Bundesliga",
    avatar: "/german-journalist.jpg",
  },
  {
    id: 6,
    journalist: "Santi Aouna",
    handle: "@Santi_J_FM",
    credibility: 3,
    content:
      "PSG are interested in signing Rafael Leão this summer. First contacts made with AC Milan representatives.",
    time: "3h",
    link: "#",
    league: "Ligue 1",
    avatar: "/french-reporter.jpg",
  },
  {
    id: 7,
    journalist: "Kim Min-jae",
    handle: "@KimMinjae_News",
    credibility: 3,
    content:
      "Ulsan Hyundai FC set to sign Brazilian midfielder Vinicius Junior on loan from Gangwon FC. Deal expected to be finalized this week.",
    time: "4h",
    link: "#",
    league: "K League",
    avatar: "/korean-journalist.jpg",
  },
]

export default function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)
  const [showLeagueSelector, setShowLeagueSelector] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light")
    } else {
      root.classList.remove("light")
    }
  }, [theme])

  const filteredNews = selectedLeague ? transferNews.filter((news) => news.league === selectedLeague) : transferNews

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        onLeaguesClick={() => setShowLeagueSelector(!showLeagueSelector)}
        selectedLeague={selectedLeague}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display tracking-wide text-balance">OFF THE PITCH</h1>
              {selectedLeague && <p className="text-muted-foreground text-sm mt-1">{selectedLeague}</p>}
            </div>
          </div>

          {showLeagueSelector && (
            <LeagueSelector
              selectedLeague={selectedLeague}
              onSelectLeague={(league) => {
                setSelectedLeague(league)
                setShowLeagueSelector(false)
              }}
              onClose={() => setShowLeagueSelector(false)}
            />
          )}

          <div className="p-4 lg:p-6 space-y-4">
            {filteredNews.map((post) => (
              <FeedPost
                key={post.id}
                {...post}
                isFavorited={favorites.includes(post.id)}
                onToggleFavorite={() => toggleFavorite(post.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
