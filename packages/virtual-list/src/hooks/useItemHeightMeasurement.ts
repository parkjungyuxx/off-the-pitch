import { useRef, useCallback, useEffect, useState } from "react";

/**
 * 아이템 높이 측정 관련 옵션
 */
interface UseItemHeightMeasurementOptions {
  /**
   * 자동 높이 측정 활성화
   */
  measureItemHeight: boolean;
  /**
   * 전체 아이템 개수
   */
  itemCount: number;
}

/**
 * 아이템 높이 측정 훅 반환값
 */
export interface UseItemHeightMeasurementReturn {
  /**
   * 측정된 아이템 높이 배열
   */
  itemHeights: (number | undefined)[];
  /**
   * 아이템 ref Map (내부 사용)
   */
  itemRefsMap: React.MutableRefObject<Map<number, HTMLElement>>;
  /**
   * 아이템 ref 콜백 생성 함수
   */
  createItemRef: (index: number) => (element: HTMLElement | null) => void;
  /**
   * 아이템 높이 업데이트 함수
   */
  updateItemHeight: (index: number, height: number) => void;
}

/**
 * 아이템 높이 자동 측정을 관리하는 훅
 */
export function useItemHeightMeasurement({
  measureItemHeight,
  itemCount,
}: UseItemHeightMeasurementOptions): UseItemHeightMeasurementReturn {
  // 배열로 관리하여 인덱스 기반 접근이 더 직관적이고 React가 변경을 잘 감지함
  const [itemHeights, setItemHeights] = useState<(number | undefined)[]>([]);
  const itemRefsMap = useRef<Map<number, HTMLElement>>(new Map());

  // 아이템 높이 업데이트 공통 함수
  const updateItemHeight = useCallback((index: number, height: number) => {
    if (height > 0) {
      setItemHeights((prev) => {
        // 배열 크기가 부족하면 확장
        const newHeights = [...prev];
        while (newHeights.length <= index) {
          newHeights.push(undefined);
        }

        const currentHeight = newHeights[index];
        // 높이가 변경되지 않았으면 업데이트하지 않음 (불필요한 리렌더링 방지)
        if (
          currentHeight !== undefined &&
          Math.abs(currentHeight - height) < 1
        ) {
          return prev; // 변경 없음
        }

        // 새로운 배열을 생성하여 React가 변경을 감지하도록 함
        newHeights[index] = height;
        return newHeights;
      });
    }
  }, []);

  // 아이템 높이 측정 함수
  const measureItemHeightAtIndex = useCallback(
    (index: number, element: HTMLElement) => {
      const height = element.offsetHeight;
      updateItemHeight(index, height);
    },
    [updateItemHeight]
  );

  // 아이템 ResizeObserver 생성 함수
  const createItemResizeObserver = useCallback(
    (index: number) => {
      return new ResizeObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const height = element.offsetHeight || entry.contentRect.height;
          updateItemHeight(index, height);
        }
      });
    },
    [updateItemHeight]
  );

  // 아이템 Observer 설정 함수 (즉시 측정 + ResizeObserver 설정)
  const setupItemObserver = useCallback(
    (
      element: HTMLElement,
      index: number,
      observers: ResizeObserver[],
      observedElements: Set<HTMLElement>
    ) => {
      if (!element || observedElements.has(element)) return;

      observedElements.add(element);

      // 즉시 높이 측정
      measureItemHeightAtIndex(index, element);

      // ResizeObserver 설정
      const observer = createItemResizeObserver(index);
      observer.observe(element);
      observers.push(observer);
    },
    [measureItemHeightAtIndex, createItemResizeObserver]
  );

  // 아이템 높이 자동 측정 (measureItemHeight가 true인 경우)
  useEffect(() => {
    if (!measureItemHeight) return;

    const observers: ResizeObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    // 초기 요소들에 대해 Observer 설정
    itemRefsMap.current.forEach((element, index) => {
      setupItemObserver(element, index, observers, observedElements);
    });

    // 약간의 지연 후 새로 추가된 요소도 측정
    const timeoutId = setTimeout(() => {
      itemRefsMap.current.forEach((element, index) => {
        setupItemObserver(element, index, observers, observedElements);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [measureItemHeight, itemCount, setupItemObserver]);

  // 아이템 ref 콜백 생성 함수
  const createItemRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      if (element) {
        const previousElement = itemRefsMap.current.get(index);
        // 같은 요소면 업데이트하지 않음 (무한 루프 방지)
        if (previousElement === element) {
          return;
        }
        itemRefsMap.current.set(index, element);
        // ref가 설정되면 즉시 높이 측정
        if (measureItemHeight) {
          // 여러 프레임에 걸쳐 측정하여 정확한 높이 확보
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (itemRefsMap.current.has(index)) {
                const el = itemRefsMap.current.get(index);
                if (el && el === element) {
                  measureItemHeightAtIndex(index, el);
                }
              }
            });
          });
        }
      } else {
        itemRefsMap.current.delete(index);
        // 요소 삭제 시 높이도 삭제하지 않음 (이전 높이를 유지하여 안정성 확보)
        // 높이는 ResizeObserver가 자동으로 업데이트하거나, 새 요소가 설정될 때 업데이트됨
      }
    },
    [measureItemHeight, measureItemHeightAtIndex]
  );

  return {
    itemHeights,
    itemRefsMap,
    createItemRef,
    updateItemHeight,
  };
}
