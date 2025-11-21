import { Card } from "@/components/ui/card";

export function FeedPostSkeleton() {
  return (
    <Card className="p-6 rounded-2xl border border-[rgb(57,57,57)] bg-card">
      <div className="flex gap-4">
        {/* 프로필 이미지 스켈레톤 */}
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
        </div>

        {/* 본문 영역 스켈레톤 */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* 헤더 스켈레톤 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded-full animate-pulse" />
            </div>
          </div>

          {/* 콘텐츠 텍스트 스켈레톤 */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          </div>

          {/* 이미지 스켈레톤 (랜덤하게 표시) */}
          <div className="h-48 w-full bg-muted rounded-2xl animate-pulse" />

          {/* 하단 버튼 스켈레톤 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}

