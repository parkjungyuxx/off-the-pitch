import type { VirtualItem } from "./useVirtualList";

/**
 * 이진 탐색을 사용하여 보이는 아이템 범위를 찾는 함수
 *
 * @param start - 뷰포트 시작 위치 (px)
 * @param end - 뷰포트 끝 위치 (px)
 * @param itemCount - 전체 아이템 개수
 * @param itemPositions - 각 아이템의 시작 위치 배열
 * @param getItemHeight - 아이템 높이를 가져오는 함수
 * @returns 보이는 시작 인덱스와 끝 인덱스
 */
export function findVisibleRange(
  start: number,
  end: number,
  itemCount: number,
  itemPositions: number[],
  getItemHeight: (index: number) => number
): { startIndex: number; endIndex: number } {
  let startIndex = 0;
  let endIndex = itemCount - 1;

  while (startIndex <= endIndex) {
    const mid = Math.floor((startIndex + endIndex) / 2);
    const itemStart = itemPositions[mid];
    const itemEnd = itemStart + getItemHeight(mid);

    if (itemEnd < start) {
      startIndex = mid + 1;
    } else if (itemStart > end) {
      endIndex = mid - 1;
    } else {
      startIndex = mid;
      break;
    }
  }

  return { startIndex, endIndex };
}

/**
 * 가상 아이템 배열을 생성하는 함수
 *
 * @param startIndex - 시작 인덱스
 * @param endIndex - 끝 인덱스
 * @param overscan - 오버스캔 개수
 * @param itemCount - 전체 아이템 개수
 * @param itemPositions - 각 아이템의 시작 위치 배열
 * @param getItemHeight - 아이템 높이를 가져오는 함수
 * @param createItemRef - 아이템 ref 생성 함수
 * @returns 가상 아이템 배열
 */
export function createVirtualItems(
  startIndex: number,
  endIndex: number,
  overscan: number,
  itemCount: number,
  itemPositions: number[],
  getItemHeight: (index: number) => number,
  createItemRef: (index: number) => (element: HTMLElement | null) => void
): VirtualItem[] {
  // 오버스캔 적용
  const visibleStart = Math.max(0, startIndex - overscan);
  const visibleEnd = Math.min(itemCount - 1, endIndex + overscan);

  // 가상 아이템 생성
  const items: VirtualItem[] = [];
  for (let i = visibleStart; i <= visibleEnd; i++) {
    const start = itemPositions[i];
    const size = getItemHeight(i);
    items.push({
      index: i,
      start,
      size,
      end: start + size,
      ref: createItemRef(i),
    });
  }

  return items;
}
