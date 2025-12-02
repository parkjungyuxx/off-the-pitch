---
sidebar_position: 3
---

# 사용 예제

## 고정 높이 아이템

```tsx
import { useVirtualList } from "@bongsik/virtual-list";

function MyList() {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

  const {
    virtualItems,
    totalHeight,
    containerStyle,
    handleScroll,
    scrollElementRef,
  } = useVirtualList({
    itemCount: items.length,
    itemHeight: 50, // 고정 높이
    containerHeight: 400,
    overscan: 3,
  });

  return (
    <div ref={scrollElementRef} style={containerStyle} onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: "absolute",
              top: virtualItem.start,
              height: virtualItem.size,
              width: "100%",
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 동적 높이 아이템 (자동 측정) ✨

각 아이템의 실제 높이를 자동으로 측정합니다. 가장 간단하고 정확한 방법입니다!

```tsx
import { useVirtualList } from "@bongsik/virtual-list";
import { useRef } from "react";

function DynamicList() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    content: `Item ${i} with variable height`,
  }));
  const containerRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalHeight } = useVirtualList({
    itemCount: items.length,
    itemHeight: 200, // 초기 추정값 (실제 높이가 측정되면 자동으로 업데이트됨)
    itemSpacing: 16, // 아이템 간 간격 (px)
    measureItemHeight: true, // 자동 높이 측정 활성화
    scrollTarget: "window", // 또는 "container"
    containerRef: containerRef,
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        minHeight: totalHeight,
        overflow: "hidden",
      }}
    >
      {virtualItems.map((virtualItem) => (
        <div
          key={virtualItem.index}
          ref={virtualItem.ref} // 자동 높이 측정을 위해 필수!
          style={{
            position: "absolute",
            top: virtualItem.start,
            width: "100%",
          }}
        >
          {items[virtualItem.index].content}
        </div>
      ))}
    </div>
  );
}
```

## 함수형 높이 (수동 계산)

```tsx
const {
  virtualItems,
  totalHeight,
  containerStyle,
  handleScroll,
  scrollElementRef,
} = useVirtualList({
  itemCount: items.length,
  itemHeight: (index) => {
    // 각 아이템의 높이를 동적으로 계산
    return index % 2 === 0 ? 50 : 80;
  },
  containerHeight: 400,
});

return (
  <div ref={scrollElementRef} style={containerStyle} onScroll={handleScroll}>
    <div style={{ height: totalHeight, position: "relative" }}>
      {virtualItems.map((virtualItem) => (
        <div
          key={virtualItem.index}
          style={{
            position: "absolute",
            top: virtualItem.start,
            height: virtualItem.size,
            width: "100%",
          }}
        >
          {items[virtualItem.index]}
        </div>
      ))}
    </div>
  </div>
);
```

## 윈도우 스크롤 모드

전체 페이지 스크롤을 사용하는 경우:

```tsx
const containerRef = useRef<HTMLDivElement>(null);

const { virtualItems, totalHeight } = useVirtualList({
  itemCount: items.length,
  itemHeight: 50,
  scrollTarget: "window",
  containerRef: containerRef, // offset 계산용
  overscan: 5,
});

return (
  <div
    ref={containerRef}
    style={{ position: "relative", minHeight: totalHeight }}
  >
    {virtualItems.map((virtualItem) => (
      <div
        key={virtualItem.index}
        style={{
          position: "absolute",
          top: virtualItem.start,
          height: virtualItem.size,
          width: "100%",
        }}
      >
        {items[virtualItem.index]}
      </div>
    ))}
  </div>
);
```

## 자동 높이 측정 사용 시 주의사항

- `measureItemHeight: true` 설정
- 각 아이템에 `ref={virtualItem.ref}` 연결 (필수!)
- `itemSpacing`으로 아이템 간 간격 설정
- 초기 `itemHeight`는 추정값으로 사용됨 (실제 높이가 측정되면 자동 업데이트)

