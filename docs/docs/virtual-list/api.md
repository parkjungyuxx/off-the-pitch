---
sidebar_position: 2
---

# API 레퍼런스

## `useVirtualList(options)`

가상화 리스트 기능을 제공하는 React 훅입니다.

### Options

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

### Returns

| Property           | Type                                                   | Description                                                    |
| ------------------ | ------------------------------------------------------ | -------------------------------------------------------------- |
| `virtualItems`     | `VirtualItem[]`                                        | 현재 보이는 가상 아이템들                                      |
| `totalHeight`      | `number`                                               | 전체 리스트의 총 높이 (px)                                     |
| `containerStyle`   | `React.CSSProperties`                                  | 컨테이너에 적용할 스타일 (`scrollTarget === "container"`일 때) |
| `handleScroll`     | `(e: React.UIEvent<HTMLElement>) => void \| undefined` | 스크롤 이벤트 핸들러. 컨테이너 모드에서만 제공                 |
| `scrollElementRef` | `RefObject<HTMLDivElement>`                            | 컨테이너 ref가 없다면 이 ref를 컨테이너에 연결                 |

## `VirtualItem`

| Property | Type                                     | Description                                               |
| -------- | ---------------------------------------- | --------------------------------------------------------- |
| `index`  | `number`                                 | 아이템의 인덱스                                           |
| `start`  | `number`                                 | 아이템의 시작 위치 (px)                                   |
| `size`   | `number`                                 | 아이템의 크기 (px)                                        |
| `end`    | `number`                                 | 아이템의 끝 위치 (px)                                     |
| `ref`    | `(element: HTMLElement \| null) => void` | 자동 높이 측정용 ref. `measureItemHeight: true`일 때 사용 |

