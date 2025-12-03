---
sidebar_position: 3
---

# 사용 예제

## TanStack Query와 함께 사용하기

기존 `useInfiniteQuery`는 스크롤 감지 로직을 직접 구현해야 하지만, 이 라이브러리와 함께 사용하면 간단합니다:

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@bongsik/infinite-scroll";

function FeedList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["posts"],
      queryFn: ({ pageParam }) => fetchPosts(pageParam),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const { sentinelRef } = useInfiniteScroll({
    loadMore: () => fetchNextPage(),
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
  });

  return (
    <div>
      {data?.pages.map((page) =>
        page.posts.map((post) => <Post key={post.id} {...post} />)
      )}
      {hasNextPage && <div ref={sentinelRef}>Loading...</div>}
    </div>
  );
}
```

## 기본 사용법 (하단 스크롤)

```tsx
const { sentinelRef } = useInfiniteScroll({
  loadMore: async () => {
    const data = await fetchMoreData();
    setItems((prev) => [...prev, ...data]);
  },
  hasMore: hasMoreData,
  isLoading: isFetching,
});
```

## 상단 스크롤 (채팅 메시지 등)

```tsx
const { sentinelRef } = useInfiniteScroll({
  loadMore: loadOlderMessages,
  hasMore: hasOlderMessages,
  isLoading: isLoadingMessages,
  direction: "up", // 상단 도달 시 로드
  threshold: 200,
});
```

## 커스텀 스크롤 컨테이너

```tsx
const containerRef = useRef<HTMLDivElement>(null);

const { sentinelRef } = useInfiniteScroll({
  loadMore: fetchMore,
  hasMore,
  isLoading,
  root: containerRef.current, // 특정 컨테이너 내부 스크롤 감지
  threshold: 50,
});

return (
  <div ref={containerRef} style={{ height: "500px", overflow: "auto" }}>
    {items.map((item) => (
      <Item key={item.id} {...item} />
    ))}
    {hasMore && <div ref={sentinelRef}>Loading...</div>}
  </div>
);
```

## 수동 로드 트리거

```tsx
const { sentinelRef, loadMore } = useInfiniteScroll({
  loadMore: fetchMore,
  hasMore,
  isLoading,
});

// 버튼 클릭 시 수동으로 로드
<button onClick={loadMore}>Load More</button>;
```

