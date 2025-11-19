"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { LeagueSelector } from "@/components/league-selector";
import { Card } from "@/components/ui/card";

export default function LeaguesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >("leagues");

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
        selectedLeague={selectedLeague}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80">
            <div className="px-4 lg:px-6 py-6">
              <h1 className="text-3xl font-display font-bold tracking-wide text-balance">
                리그
              </h1>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <LeagueSelector
              selectedLeague={selectedLeague}
              onSelectLeague={(league) => {
                setSelectedLeague(league);
              }}
              onClose={() => {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

