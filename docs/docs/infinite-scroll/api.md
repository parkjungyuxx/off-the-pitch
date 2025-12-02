---
sidebar_position: 2
---

# API 레퍼런스

## `useInfiniteScroll(options)`

무한 스크롤 기능을 제공하는 React 훅입니다.

### Options

| Property     | Type                          | Default      | Description                                                             |
| ------------ | ----------------------------- | ------------ | ----------------------------------------------------------------------- |
| `loadMore`   | `() => void \| Promise<void>` | **required** | 다음 페이지를 로드하는 함수. 동기/비동기 모두 지원                      |
| `hasMore`    | `boolean`                     | `false`      | 더 불러올 데이터가 있는지 여부                                          |
| `isLoading`  | `boolean`                     | `false`      | 현재 로딩 중인지 여부                                                   |
| `threshold`  | `number`                      | `100`        | 스크롤 트리거가 발생하는 거리 (px). 하단/상단으로부터의 거리            |
| `direction`  | `"up" \| "down"`              | `"down"`     | 스크롤 방향. `"down"`은 하단 도달 시, `"up"`은 상단 도달 시 로드        |
| `root`       | `HTMLElement \| null`         | `null`       | 스크롤 컨테이너 요소. `null`이면 `window` 사용                          |
| `rootMargin` | `string`                      | `"0px"`      | Intersection Observer의 rootMargin. CSS margin 형식 (예: `"10px 20px"`) |

### Returns

| Property      | Type                        | Description                                   |
| ------------- | --------------------------- | --------------------------------------------- |
| `sentinelRef` | `RefObject<HTMLDivElement>` | 스크롤 감지를 위한 sentinel 요소에 연결할 ref |
| `loadMore`    | `() => void`                | 수동으로 다음 페이지를 로드하는 함수          |

