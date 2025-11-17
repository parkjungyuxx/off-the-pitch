"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Heart, Sun, Moon, LogOut } from "lucide-react";
import { BsTrophy } from "react-icons/bs";
import { CgDetailsMore } from "react-icons/cg";
import { GoHomeFill } from "react-icons/go";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeMenu: "home" | "search" | "favorites" | "leagues" | null;
  onMenuClick: (menu: "home" | "search" | "favorites" | "leagues") => void;
  selectedLeague: string | null;
  showLeagueSelector?: boolean;
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

export function Sidebar({
  activeMenu,
  onMenuClick,
  selectedLeague,
  showLeagueSelector = false,
  theme = "dark",
  onThemeChange,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-background z-20">
        <div className="mb-8">
          <Link href="/">
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="OFF THE PITCH"
                width={34}
                height={34}
                className="rounded-full"
              />
            </div>
          </Link>
        </div>

        <nav className="flex flex-col items-center justify-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
              activeMenu === "home" &&
                "bg-sidebar-accent hover:bg-sidebar-accent"
            )}
            onClick={() => onMenuClick("home")}
            asChild
          >
            <Link href="/">
              <GoHomeFill className="size-7" style={{ strokeWidth: 1.5 }} />
              <span className="sr-only">Home</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
              activeMenu === "search" &&
                "bg-sidebar-accent hover:bg-sidebar-accent"
            )}
            onClick={() => onMenuClick("search")}
          >
            <Search className="size-7" />
            <span className="sr-only">Search</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
              activeMenu === "favorites" &&
                "bg-sidebar-accent hover:bg-sidebar-accent"
            )}
            onClick={() => onMenuClick("favorites")}
          >
            <Heart className="size-7" />
            <span className="sr-only">Favorites</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
              activeMenu === "leagues" &&
                "bg-sidebar-accent hover:bg-sidebar-accent"
            )}
            onClick={() => onMenuClick("leagues")}
          >
            <BsTrophy className="size-7" />
            <span className="sr-only">Football Leagues</span>
          </Button>
        </nav>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-12 rounded-xl hover:bg-sidebar-accent mt-auto"
            >
              <CgDetailsMore className="size-7" />
              <span className="sr-only">More</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="end"
            className="w-48 p-2 bg-[#141414] border-[#1a1a1a]"
          >
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal hover:bg-sidebar-accent"
                onClick={() =>
                  onThemeChange?.(theme === "dark" ? "light" : "dark")
                }
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal text-destructive hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-20">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
            activeMenu === "home" && "bg-sidebar-accent hover:bg-sidebar-accent"
          )}
          onClick={() => onMenuClick("home")}
          asChild
        >
          <Link href="/">
            <GoHomeFill className="size-7" style={{ strokeWidth: 1.5 }} />
            <span className="sr-only">Home</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
            activeMenu === "search" &&
              "bg-sidebar-accent hover:bg-sidebar-accent"
          )}
          onClick={() => onMenuClick("search")}
        >
          <Search className="size-7" />
          <span className="sr-only">Search</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
            activeMenu === "favorites" &&
              "bg-sidebar-accent hover:bg-sidebar-accent"
          )}
          onClick={() => onMenuClick("favorites")}
        >
          <Heart className="size-7" />
          <span className="sr-only">Favorites</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-16 h-12 rounded-xl hover:bg-sidebar-accent",
            activeMenu === "leagues" &&
              "bg-sidebar-accent hover:bg-sidebar-accent"
          )}
          onClick={() => onMenuClick("leagues")}
        >
          <BsTrophy className="size-7" />
          <span className="sr-only">Football Leagues</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-12 rounded-xl hover:bg-sidebar-accent"
            >
              <CgDetailsMore className="size-7" />
              <span className="sr-only">More</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-48 p-2 bg-[#141414] border-[#1a1a1a]"
          >
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal hover:bg-sidebar-accent"
                onClick={() =>
                  onThemeChange?.(theme === "dark" ? "light" : "dark")
                }
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal text-destructive hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </>
  );
}
