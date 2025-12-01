# @bongsik/virtual-list

React 애플리케이션을 위한 타입 안전한 가상화 리스트 훅 라이브러리입니다. 대량의 데이터를 효율적으로 렌더링하기 위해 뷰포트에 보이는 아이템만 렌더링하는 가상화 기능을 제공합니다.

## 🎯 해결하고자 하는 문제

React 애플리케이션에서 수천, 수만 개의 아이템을 렌더링해야 할 때, 기존 라이브러리들을 사용하면서 몇 가지 문제에 직면했습니다.

**react-window**는 가볍고 성능이 좋지만, 동적 높이 아이템을 처리하기가 복잡했습니다. 각 아이템의 높이를 미리 계산하거나 `useSize` 훅을 사용해야 했고, 아이템 높이가 변경될 때 스크롤 위치가 부정확해지는 문제가 있었습니다.

**react-virtualized**는 기능이 풍부하지만 번들 크기가 크고, API가 복잡하여 학습 곡선이 높았습니다. 또한 최신 React 패턴과의 호환성 문제가 있었고, TypeScript 지원이 완전하지 않았습니다.

이러한 문제들을 해결하기 위해, **자동 높이 측정 기능을 내장한 가상화 훅**을 만들었습니다. ResizeObserver를 활용하여 각 아이템의 실제 높이를 자동으로 측정하고, 높이가 변경되어도 정확한 스크롤 위치를 유지합니다. TypeScript로 완전히 타입 안전하게 작성했으며, 컨테이너 스크롤과 윈도우 스크롤 모두를 지원합니다.

## 📦 설치

```bash
npm install @bongsik/virtual-list
# or
pnpm add @bongsik/virtual-list
# or
yarn add @bongsik/virtual-list
```

## 🚀 빠른 시작

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

### 동적 높이 아이템 (자동 측정) ✨

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

## 📚 API 레퍼런스

### `useVirtualList(options)`

가상화 리스트 기능을 제공하는 React 훅입니다.

#### Options

| Property            | Type                                    | Default       | Description                                                                                      |
| ------------------- | --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `itemCount`         | `number`                                | **required**  | 전체 아이템 개수                                                                                 |
| `itemHeight`        | `number \| ((index: number) => number)` | **required**  | 각 아이템의 높이 (px) 또는 높이 계산 함수. `measureItemHeight: true`일 때는 초기 추정값으로 사용 |
| `containerHeight`   | `number`                                | `0`           | 컨테이너 높이. `containerRef`나 `scrollElementRef`를 사용하는 경우 선택                          |
| `containerRef`      | `RefObject<HTMLElement>`                | `undefined`   | 이미 존재하는 컨테이너 요소를 전달할 때 사용                                                     |
| `itemSpacing`       | `number`                                | `0`           | 아이템 간 간격 (px). `measureItemHeight: true`일 때 사용                                         |
| `measureItemHeight` | `boolean`                               | `false`       | 자동 높이 측정 활성화. `true`로 설정하면 각 아이템의 실제 높이를 자동으로 측정                   |
| `overscan`          | `number`                                | `3`           | 화면 밖에 렌더링할 추가 아이템 개수                                                              |
| `scrollOffset`      | `number`                                | `0`           | 초기 스크롤 오프셋 (px) 또는 외부 제어 값                                                        |
| `scrollTarget`      | `"container" \| "window"`               | `"container"` | 스크롤을 감지할 대상. window 모드에서는 `handleScroll`/`containerStyle`이 필요 없음              |

#### Returns

| Property           | Type                                                   | Description                                                    |
| ------------------ | ------------------------------------------------------ | -------------------------------------------------------------- |
| `virtualItems`     | `VirtualItem[]`                                        | 현재 보이는 가상 아이템들                                      |
| `totalHeight`      | `number`                                               | 전체 리스트의 총 높이 (px)                                     |
| `containerStyle`   | `React.CSSProperties`                                  | 컨테이너에 적용할 스타일 (`scrollTarget === "container"`일 때) |
| `handleScroll`     | `(e: React.UIEvent<HTMLElement>) => void \| undefined` | 스크롤 이벤트 핸들러. 컨테이너 모드에서만 제공                 |
| `scrollElementRef` | `RefObject<HTMLDivElement>`                            | 컨테이너 ref가 없다면 이 ref를 컨테이너에 연결                 |

### `VirtualItem`

| Property | Type                                     | Description                                               |
| -------- | ---------------------------------------- | --------------------------------------------------------- |
| `index`  | `number`                                 | 아이템의 인덱스                                           |
| `start`  | `number`                                 | 아이템의 시작 위치 (px)                                   |
| `size`   | `number`                                 | 아이템의 크기 (px)                                        |
| `end`    | `number`                                 | 아이템의 끝 위치 (px)                                     |
| `ref`    | `(element: HTMLElement \| null) => void` | 자동 높이 측정용 ref. `measureItemHeight: true`일 때 사용 |

## 💡 사용 예제

### 함수형 높이 (수동 계산)

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

### 윈도우 스크롤 모드

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

### 자동 높이 측정 사용 시 주의사항

- `measureItemHeight: true` 설정
- 각 아이템에 `ref={virtualItem.ref}` 연결 (필수!)
- `itemSpacing`으로 아이템 간 간격 설정
- 초기 `itemHeight`는 추정값으로 사용됨 (실제 높이가 측정되면 자동 업데이트)

## 🛠️ 기술 스택

- **TypeScript**: 완전한 타입 안전성 보장
- **React Hooks**: 최신 React 패턴 활용
- **ResizeObserver API**: 네이티브 브라우저 API로 아이템 높이 자동 측정
- **requestAnimationFrame**: 스크롤 이벤트 성능 최적화
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
virtual-list/
├── src/
│   ├── index.ts              # Public API export
│   └── useVirtualList.ts     # 핵심 훅 구현
├── dist/                      # 빌드 결과물
├── package.json
├── tsconfig.json             # TypeScript 설정 (strict mode)
├── tsup.config.ts            # 빌드 설정
└── README.md
```

## ✨ 주요 특징

이 라이브러리는 react-window처럼 경량화되어 있으면서도, react-virtualized의 풍부한 기능을 제공합니다. ResizeObserver를 활용한 자동 높이 측정 기능으로 동적 높이 아이템을 쉽게 처리할 수 있으며, 컨테이너 스크롤과 윈도우 스크롤을 모두 지원합니다.

TypeScript로 완전히 작성되어 컴파일 타임에 타입 오류를 잡을 수 있으며, requestAnimationFrame을 사용하여 스크롤 성능을 최적화했습니다. React만 peer dependency로 요구하여 번들 크기를 최소화했고, 이진 탐색 알고리즘을 사용하여 대량의 아이템에서도 빠르게 동작합니다.

## 🔧 TypeScript 설정

이 라이브러리는 TypeScript strict mode로 작성되었습니다:

- `strict: true`
- 완전한 타입 정의 제공
- JSDoc 주석으로 IDE 자동완성 지원
