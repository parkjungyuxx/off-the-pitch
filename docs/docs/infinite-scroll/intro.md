---
sidebar_position: 1
---

# @bongsik/infinite-scroll

React 애플리케이션을 위한 타입 안전한 무한 스크롤 훅 라이브러리입니다. Intersection Observer API를 활용하여 성능 최적화된 무한 스크롤 기능을 제공합니다.

## 설치

```bash
npm install @bongsik/infinite-scroll
# or
pnpm add @bongsik/infinite-scroll
# or
yarn add @bongsik/infinite-scroll
```

## 빠른 시작

```tsx
import { useInfiniteScroll } from "@bongsik/infinite-scroll";
import { useState } from "react";

function FeedList() {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMore = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newItems = await fetchNextPage();
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length > 0);
    } finally {
      setIsLoading(false);
    }
  };

  const { sentinelRef } = useInfiniteScroll({
    loadMore: fetchMore,
    hasMore,
    isLoading,
  });

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
      {hasMore && <div ref={sentinelRef}>Loading...</div>}
    </div>
  );
}
```

## 다음 단계

- [API 레퍼런스](/docs/infinite-scroll/api)
- [고급 사용법](/docs/infinite-scroll/advanced)

