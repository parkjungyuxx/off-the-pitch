# @bongsik/infinite-scroll

React 애플리케이션을 위한 타입 안전한 무한 스크롤 훅 라이브러리입니다. Intersection Observer API를 활용하여 성능 최적화된 무한 스크롤 기능을 제공합니다.

## 🎯 해결하고자 하는 문제

React 애플리케이션에서 무한 스크롤을 구현할 때, 기존 라이브러리들을 사용하면서 몇 가지 문제에 직면했습니다.

**TanStack Query의 `useInfiniteQuery`**를 사용하면 데이터 페칭은 편리하지만, 스크롤 감지 로직을 직접 구현해야 했습니다. 또한 특정 데이터 페칭 라이브러리에 종속되어 다른 상태 관리 방식이나 데이터 소스와 함께 사용하기 어려웠습니다.

**react-infinite-scroll-component** 같은 전용 라이브러리는 `scroll` 이벤트 리스너를 직접 사용하여 성능 이슈가 있었고, 불필요한 의존성으로 인해 번들 크기가 커졌습니다. TypeScript 지원도 제한적이어서 타입 안전성을 보장하기 어려웠습니다.

이러한 문제들을 해결하기 위해, **데이터 페칭 로직과 완전히 분리된 순수한 스크롤 감지 훅**을 만들었습니다. Intersection Observer API를 활용하여 성능을 최적화하고, 어떤 데이터 페칭 라이브러리와도 함께 사용할 수 있도록 설계했습니다. TypeScript로 완전히 타입 안전하게 작성했으며, 최소한의 의존성으로 경량화했습니다.

## 📦 설치

```bash
npm install @bongsik/infinite-scroll
# or
pnpm add @bongsik/infinite-scroll
# or
yarn add @bongsik/infinite-scroll
```

## 🚀 빠른 시작

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

## 📚 API 레퍼런스

### `useInfiniteScroll(options)`

무한 스크롤 기능을 제공하는 React 훅입니다.

#### Options

| Property     | Type                          | Default      | Description                                                             |
| ------------ | ----------------------------- | ------------ | ----------------------------------------------------------------------- |
| `loadMore`   | `() => void \| Promise<void>` | **required** | 다음 페이지를 로드하는 함수. 동기/비동기 모두 지원                      |
| `hasMore`    | `boolean`                     | `false`      | 더 불러올 데이터가 있는지 여부                                          |
| `isLoading`  | `boolean`                     | `false`      | 현재 로딩 중인지 여부                                                   |
| `threshold`  | `number`                      | `100`        | 스크롤 트리거가 발생하는 거리 (px). 하단/상단으로부터의 거리            |
| `direction`  | `"up" \| "down"`              | `"down"`     | 스크롤 방향. `"down"`은 하단 도달 시, `"up"`은 상단 도달 시 로드        |
| `root`       | `HTMLElement \| null`         | `null`       | 스크롤 컨테이너 요소. `null`이면 `window` 사용                          |
| `rootMargin` | `string`                      | `"0px"`      | Intersection Observer의 rootMargin. CSS margin 형식 (예: `"10px 20px"`) |

#### Returns

| Property      | Type                        | Description                                   |
| ------------- | --------------------------- | --------------------------------------------- |
| `sentinelRef` | `RefObject<HTMLDivElement>` | 스크롤 감지를 위한 sentinel 요소에 연결할 ref |
| `loadMore`    | `() => void`                | 수동으로 다음 페이지를 로드하는 함수          |

## 💡 사용 예제

### TanStack Query와 함께 사용하기

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

### 기본 사용법 (하단 스크롤)

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

### 상단 스크롤 (채팅 메시지 등)

```tsx
const { sentinelRef } = useInfiniteScroll({
  loadMore: loadOlderMessages,
  hasMore: hasOlderMessages,
  isLoading: isLoadingMessages,
  direction: "up", // 상단 도달 시 로드
  threshold: 200,
});
```

### 커스텀 스크롤 컨테이너

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

### 수동 로드 트리거

```tsx
const { sentinelRef, loadMore } = useInfiniteScroll({
  loadMore: fetchMore,
  hasMore,
  isLoading,
});

// 버튼 클릭 시 수동으로 로드
<button onClick={loadMore}>Load More</button>;
```

## 🛠️ 기술 스택

- **TypeScript**: 완전한 타입 안전성 보장
- **React Hooks**: 최신 React 패턴 활용
- **Intersection Observer API**: 네이티브 브라우저 API로 최적 성능
- **tsup**: 빠른 빌드와 ESM/CJS 듀얼 포맷 지원

## 📋 빌드 및 개발

### 빌드

```bash
pnpm build
```

- ESM과 CJS 포맷 모두 생성
- TypeScript 타입 정의 파일 (.d.ts) 자동 생성
- Source map 포함

### 개발 모드

```bash
pnpm dev
```

파일 변경 시 자동으로 재빌드됩니다.

### 타입 체크

```bash
pnpm type-check
```

### 린트

```bash
pnpm lint
```

## 🏗️ 프로젝트 구조

```
infinite-scroll/
├── src/
│   ├── index.ts              # Public API export
│   └── useInfiniteScroll.ts  # 핵심 훅 구현
├── dist/                      # 빌드 결과물
├── package.json
├── tsconfig.json             # TypeScript 설정 (strict mode)
├── tsup.config.ts            # 빌드 설정
└── README.md
```

## ✨ 주요 특징

이 라이브러리는 데이터 페칭 로직과 완전히 분리되어 있어 TanStack Query, SWR, Apollo, 또는 순수 fetch와 함께 사용할 수 있습니다. Intersection Observer API를 활용하여 `react-infinite-scroll-component`처럼 scroll 이벤트를 직접 사용하는 방식보다 훨씬 효율적으로 동작합니다.

TypeScript로 완전히 작성되어 컴파일 타임에 타입 오류를 잡을 수 있으며, React만 peer dependency로 요구하여 번들 크기를 최소화했습니다. 상단/하단 스크롤, 커스텀 컨테이너 등 다양한 시나리오를 지원하며, React의 useEffect cleanup을 통해 메모리 누수를 자동으로 방지합니다.

## 🔧 TypeScript 설정

이 라이브러리는 TypeScript strict mode로 작성되었습니다:

- `strict: true`
- 완전한 타입 정의 제공
- JSDoc 주석으로 IDE 자동완성 지원

