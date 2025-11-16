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
  images?: string[] | null
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
  images,
  time,
  link,
  avatar,
  isFavorited = false,
  onToggleFavorite,
}: FeedPostProps) {
  const [isTranslated, setIsTranslated] = useState(false)
  const [failedImageIdx, setFailedImageIdx] = useState<Set<number>>(new Set())

  return (
    <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card hover:bg-card/80 transition-all cursor-pointer group shadow-lg hover:shadow-xl">
      <div className="flex gap-4">
        {/* 프로필 이미지 */}
        <div className="shrink-0">
          <Image src={avatar || "/placeholder.svg"} alt={journalist} width={48} height={48} className="rounded-full" />
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-semibold text-card-foreground">{journalist}</span>
              <CredibilityIcon level={credibility} />
              <span className="text-muted-foreground text-sm">{handle}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                    "rounded-full px-4 h-8 text-xs font-medium transition-all border border-[rgb(57,57,57)]",
                    isFavorited
                      ? "bg-[rgb(24,24,24)] text-white hover:bg-[rgb(24,24,24)]"
                      : "bg-white text-black hover:bg-white/90",
                  )}
                >
                  {isFavorited ? "팔로잉" : "팔로우"}
                </Button>
              )}
            </div>
          </div>

          <p className="text-card-foreground text-[15px] leading-relaxed mb-3">{content}</p>

          {images && images.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {images.slice(0, 4).map((src, idx) => {
                if (!src || failedImageIdx.has(idx)) return null
                return (
                  <img
                    key={idx}
                    src={src}
                    alt={`${journalist} media ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto rounded-2xl object-cover bg-muted"
                    onError={() => {
                      setFailedImageIdx((prev) => {
                        const next = new Set(prev)
                        next.add(idx)
                        return next
                      })
                    }}
                  />
                )
              })}
            </div>
          )}

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
              {isTranslated ? "원문 보기" : "번역 보기"}
            </Button>

            <Link
              href={link}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span>원문 트윗 보기</span>
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
    5: "🌘", // 신뢰도 1단계(초승달)
    4: "🌓", // 신뢰도 2단계(반달)
    3: "🌕", // 신뢰도 3단계(보름달)
  }

  return (
    <span className="text-lg leading-none" title={`Tier ${6 - level}`}>
      {icons[level]}
    </span>
  )
}
