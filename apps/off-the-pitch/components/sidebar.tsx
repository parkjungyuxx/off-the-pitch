"use client";

import Link from "next/link";
import { Search, Heart, Sun, Moon, LogOut } from "lucide-react";
import { CgDetailsMore } from "react-icons/cg";
import { GoHome, GoHomeFill } from "react-icons/go";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/use-logout";
import { useThemeToggle } from "@/hooks/use-theme-toggle";

interface SidebarProps {
  activeMenu: "home" | "search" | "favorites" | null;
  onMenuClick: (menu: "home" | "search" | "favorites") => void;
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

export function Sidebar({
  activeMenu,
  onMenuClick,
  theme = "dark",
  onThemeChange,
}: SidebarProps) {
  const { handleLogout } = useLogout();
  const { toggleTheme } = useThemeToggle({ theme, onThemeChange });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-background z-20">
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
              {activeMenu === "home" ? (
                <GoHomeFill className="size-7" style={{ strokeWidth: 1 }} />
              ) : (
                <GoHome className="size-7" style={{ strokeWidth: 1 }} />
              )}
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
            asChild
          >
            <Link href="/search">
              <Search className="size-7" />
              <span className="sr-only">Search</span>
            </Link>
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
            asChild
          >
            <Link href="/favorites">
              {activeMenu === "favorites" ? (
                <Heart className="size-7 fill-red-500 text-red-500" />
              ) : (
                <Heart className="size-7" />
              )}
              <span className="sr-only">Favorites</span>
            </Link>
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
            className={cn(
              "w-48 p-2",
              theme === "light"
                ? "bg-white border-gray-300"
                : "bg-[#141414] border-[#1a1a1a]"
            )}
          >
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal hover:bg-sidebar-accent"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>라이트모드</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>다크모드</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal text-destructive hover:bg-sidebar-accent"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
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
            {activeMenu === "home" ? (
              <GoHomeFill className="size-7" style={{ strokeWidth: 1 }} />
            ) : (
              <GoHome className="size-7" style={{ strokeWidth: 1 }} />
            )}
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
          asChild
        >
          <Link href="/search">
            <Search className="size-7" />
            <span className="sr-only">Search</span>
          </Link>
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
          asChild
        >
          <Link href="/favorites">
            {activeMenu === "favorites" ? (
              <Heart className="size-7 fill-red-500 text-red-500" />
            ) : (
              <Heart className="size-7" />
            )}
            <span className="sr-only">Favorites</span>
          </Link>
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
            className={cn(
              "w-48 p-2",
              theme === "light"
                ? "bg-white border-gray-300"
                : "bg-[#141414] border-[#1a1a1a]"
            )}
          >
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal hover:bg-sidebar-accent"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>라이트모드</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>다크모드</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sm font-normal text-destructive hover:bg-sidebar-accent"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </>
  );
}
