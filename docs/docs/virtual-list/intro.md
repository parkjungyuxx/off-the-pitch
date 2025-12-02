---
sidebar_position: 1
---

# @bongsik/virtual-list

React 애플리케이션을 위한 타입 안전한 가상화 리스트 훅 라이브러리입니다. 대량의 데이터를 효율적으로 렌더링하기 위해 뷰포트에 보이는 아이템만 렌더링하는 가상화 기능을 제공합니다.

## 설치

```bash
npm install @bongsik/virtual-list
# or
pnpm add @bongsik/virtual-list
# or
yarn add @bongsik/virtual-list
```

## 빠른 시작

### 고정 높이 아이템

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
    itemHeight: 50,
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
              top: 0,
              left: 0,
              width: "100%",
              height: virtualItem.height,
              transform: `translateY(${virtualItem.offsetTop}px)`,
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

## 다음 단계

- [API 레퍼런스](/docs/virtual-list/api)
- [동적 높이 사용법](/docs/virtual-list/dynamic-height)

