---
sidebar_position: 1
---

# @bongsik/virtual-list

React 애플리케이션을 위한 타입 안전한 가상화 리스트 훅 라이브러리입니다. 대량의 데이터를 효율적으로 렌더링하기 위해 뷰포트에 보이는 아이템만 렌더링하는 가상화 기능을 제공합니다.

## 해결하고자 하는 문제

React 애플리케이션에서 수천, 수만 개의 아이템을 렌더링해야 할 때, 기존 라이브러리들을 사용하면서 몇 가지 문제에 직면했습니다.

**react-window**는 가볍고 성능이 좋지만, 동적 높이 아이템을 처리하기가 복잡했습니다. 각 아이템의 높이를 미리 계산하거나 `useSize` 훅을 사용해야 했고, 아이템 높이가 변경될 때 스크롤 위치가 부정확해지는 문제가 있었습니다.

**react-virtualized**는 기능이 풍부하지만 번들 크기가 크고, API가 복잡하여 학습 곡선이 높았습니다. 또한 최신 React 패턴과의 호환성 문제가 있었고, TypeScript 지원이 완전하지 않았습니다.

이러한 문제들을 해결하기 위해, **자동 높이 측정 기능을 내장한 가상화 훅**을 만들었습니다. ResizeObserver를 활용하여 각 아이템의 실제 높이를 자동으로 측정하고, 높이가 변경되어도 정확한 스크롤 위치를 유지합니다. TypeScript로 완전히 타입 안전하게 작성했으며, 컨테이너 스크롤과 윈도우 스크롤 모두를 지원합니다.

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

## 주요 특징

- ✅ **타입 안전성**: 완전한 TypeScript 지원
- ⚡ **고성능**: ResizeObserver API 및 requestAnimationFrame 활용
- 🎯 **자동 높이 측정**: 동적 높이 아이템을 쉽게 처리
- 📦 **경량화**: 최소한의 의존성 (React만 peer dependency)
- 🔧 **유연성**: 컨테이너 스크롤과 윈도우 스크롤 모두 지원

## 다음 단계

- [API 레퍼런스](/docs/virtual-list/api)
- [사용 예제](/docs/virtual-list/examples)

