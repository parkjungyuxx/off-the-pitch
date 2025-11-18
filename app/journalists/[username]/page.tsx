"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

interface JournalistPageProps {
  params: {
    username: string;
  };
}

export default function JournalistPage({ params }: JournalistPageProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeMenu, setActiveMenu] = useState<
    "home" | "search" | "favorites" | "leagues" | null
  >(null);

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
        onMenuClick={(menu) => setActiveMenu(menu)}
        selectedLeague={null}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 ml-0 lg:ml-20">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-10">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              @{params.username}님의 프로필 페이지입니다.
            </p>
            <h1 className="text-3xl font-display font-bold tracking-wide">
              {params.username}
            </h1>
            <p className="text-card-foreground text-sm">
              트윗 내용
            </p>
            <div>
              <Link href="/search">
                <Button variant="outline" className="rounded-full px-5">
                  검색 페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

