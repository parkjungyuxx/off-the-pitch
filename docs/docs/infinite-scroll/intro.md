---
sidebar_position: 1
---

# @bongsik/infinite-scroll

React 애플리케이션을 위한 타입 안전한 무한 스크롤 훅 라이브러리입니다. Intersection Observer API를 활용하여 성능 최적화된 무한 스크롤 기능을 제공합니다.

## 해결하고자 하는 문제

React 애플리케이션에서 무한 스크롤을 구현할 때, 기존 라이브러리들을 사용하면서 몇 가지 문제에 직면했습니다.

**TanStack Query의 `useInfiniteQuery`**를 사용하면 데이터 페칭은 편리하지만, 스크롤 감지 로직을 직접 구현해야 했습니다. 또한 특정 데이터 페칭 라이브러리에 종속되어 다른 상태 관리 방식이나 데이터 소스와 함께 사용하기 어려웠습니다.

**react-infinite-scroll-component** 같은 전용 라이브러리는 `scroll` 이벤트 리스너를 직접 사용하여 성능 이슈가 있었고, 불필요한 의존성으로 인해 번들 크기가 커졌습니다. TypeScript 지원도 제한적이어서 타입 안전성을 보장하기 어려웠습니다.

이러한 문제들을 해결하기 위해, **데이터 페칭 로직과 완전히 분리된 순수한 스크롤 감지 훅**을 만들었습니다. Intersection Observer API를 활용하여 성능을 최적화하고, 어떤 데이터 페칭 라이브러리와도 함께 사용할 수 있도록 설계했습니다. TypeScript로 완전히 타입 안전하게 작성했으며, 최소한의 의존성으로 경량화했습니다.

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
    threshold: 100, // 하단 100px 전에 로드
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

## 주요 특징

- ✅ **타입 안전성**: 완전한 TypeScript 지원
- ⚡ **고성능**: Intersection Observer API 활용
- 🎯 **유연성**: 데이터 페칭 로직과 완전히 분리
- 📦 **경량화**: 최소한의 의존성 (React만 peer dependency)
- 🔧 **사용하기 쉬움**: 직관적인 API

## 다음 단계

- [API 레퍼런스](/docs/infinite-scroll/api)
- [사용 예제](/docs/infinite-scroll/examples)

