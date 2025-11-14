"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Languages } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FeedPostProps {
  journalist: string
  handle: string
  credibility: 3 | 4 | 5
  content: string
  time: string
  link: string
  avatar: string
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

export function FeedPost({
  journalist,
  handle,
  credibility,
  content,
  time,
  link,
  avatar,
  isFavorited = false,
  onToggleFavorite,
}: FeedPostProps) {
  const [isTranslated, setIsTranslated] = useState(false)

  return (
    <Card className="p-6 rounded-2xl border border-border bg-card hover:bg-card/80 transition-all cursor-pointer group shadow-lg hover:shadow-xl">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image src={avatar || "/placeholder.svg"} alt={journalist} width={48} height={48} className="rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-semibold text-card-foreground">{journalist}</span>
              <CredibilityIcon level={credibility} />
              <span className="text-muted-foreground text-sm">{handle}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-muted-foreground text-sm">{time}</span>
              {onToggleFavorite && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite()
                  }}
                  size="sm"
                  variant={isFavorited ? "secondary" : "outline"}
                  className={cn(
                    "rounded-full px-4 h-8 text-xs font-medium transition-all",
                    isFavorited
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-background text-foreground hover:bg-secondary border-border",
                  )}
                >
                  {isFavorited ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>

          <p className="text-card-foreground text-[15px] leading-relaxed mb-3">{content}</p>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsTranslated(!isTranslated)
              }}
            >
              <Languages className="w-3.5 h-3.5 mr-1.5" />
              {isTranslated ? "Show Original" : "Translate"}
            </Button>

            <Link
              href={link}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span>View original post</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CredibilityIcon({ level }: { level: 3 | 4 | 5 }) {
  const icons = {
    5: "🌘", // Tier 1 - Crescent moon
    4: "🌓", // Tier 2 - Half moon
    3: "🌕", // Tier 3 - Full moon
  }

  return (
    <span className="text-lg leading-none" title={`Tier ${6 - level}`}>
      {icons[level]}
    </span>
  )
}
