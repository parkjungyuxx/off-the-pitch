import { useMemo, useCallback } from "react";

/**
 * 아이템 위치 계산 옵션
 */
interface UseItemPositionsOptions {
  /**
   * 전체 아이템 개수
   */
  itemCount: number;
  /**
   * 각 아이템의 높이 (px) 또는 높이 계산 함수
   */
  itemHeight: number | ((index: number) => number);
  /**
   * 측정된 아이템 높이 배열
   */
  itemHeights: (number | undefined)[];
  /**
   * 자동 높이 측정 활성화 여부
   */
  measureItemHeight: boolean;
  /**
   * 아이템 간 간격 (px)
   */
  itemSpacing: number;
}

/**
 * 아이템 위치 계산 훅 반환값
 */
export interface UseItemPositionsReturn {
  /**
   * 각 아이템의 시작 위치 배열
   */
  itemPositions: number[];
  /**
   * 아이템 높이 계산 함수
   */
  getItemHeight: (index: number) => number;
  /**
   * 전체 리스트의 총 높이 (px)
   */
  totalHeight: number;
}

/**
 * 아이템 위치와 전체 높이를 계산하는 훅
 */
export function useItemPositions({
  itemCount,
  itemHeight,
  itemHeights,
  measureItemHeight,
  itemSpacing,
}: UseItemPositionsOptions): UseItemPositionsReturn {
  // 아이템 높이 계산 함수 (itemHeights를 직접 참조)
  // 배열을 사용하므로 React가 변경을 자동으로 감지함
  const getItemHeight = useCallback(
    (index: number): number => {
      // measureItemHeight가 활성화되고 해당 인덱스의 높이가 측정된 경우
      if (
        measureItemHeight &&
        index < itemHeights.length &&
        itemHeights[index] !== undefined
      ) {
        const measuredHeight = itemHeights[index]!;
        return measuredHeight + itemSpacing;
      }
      // 그 외의 경우 기존 로직 사용
      const baseHeight =
        typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
      return baseHeight;
    },
    [itemHeight, itemHeights, measureItemHeight, itemSpacing]
  );

  // 아이템 위치 배열 계산
  const itemPositions = useMemo(() => {
    const positions: number[] = [0];
    for (let i = 1; i < itemCount; i++) {
      positions[i] = positions[i - 1] + getItemHeight(i - 1);
    }
    return positions;
  }, [itemCount, getItemHeight]);

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    if (itemCount === 0) return 0;
    const lastItemIndex = itemCount - 1;
    return itemPositions[lastItemIndex] + getItemHeight(lastItemIndex);
  }, [itemCount, itemPositions, getItemHeight]);

  return {
    itemPositions,
    getItemHeight,
    totalHeight,
  };
}
