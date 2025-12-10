import {
  useRef,
  useMemo,
  type RefObject,
  type CSSProperties,
  type UIEvent,
} from "react";
import { findVisibleRange, createVirtualItems } from "./utils";
import { useItemHeightMeasurement } from "./hooks/useItemHeightMeasurement";
import { useContainerHeight } from "./hooks/useContainerHeight";
import { useScrollHandler } from "./hooks/useScrollHandler";
import { useItemPositions } from "./hooks/useItemPositions";

/**
 * 가상화된 리스트 아이템 타입
 */
export interface VirtualItem {
  /**
   * 아이템의 인덱스
   */
  index: number;
  /**
   * 아이템의 시작 위치 (px)
   */
  start: number;
  /**
   * 아이템의 크기 (px)
   */
  size: number;
  /**
   * 아이템의 끝 위치 (px)
   */
  end: number;
  /**
   * 아이템 요소에 연결할 ref 콜백
   * 자동 높이 측정을 위해 사용됩니다.
   * 예: <div ref={virtualItem.ref}>...</div>
   */
  ref: (element: HTMLElement | null) => void;
}

/**
 * useVirtualList 옵션 타입
 */
export interface UseVirtualListOptions {
  /**
   * 전체 아이템 개수
   */
  itemCount: number;
  /**
   * 각 아이템의 높이 (px) 또는 동적 높이를 계산하는 함수
   * itemRefs가 제공되면 이 값은 초기 추정값으로만 사용됩니다.
   */
  itemHeight: number | ((index: number) => number);
  /**
   * 컨테이너의 높이 (px)
   * containerRef가 제공되면 자동으로 측정되며, 이 값은 초기값으로 사용됩니다.
   */
  containerHeight?: number;
  /**
   * 컨테이너 요소의 ref (자동 높이 측정용 및 offset 계산용)
   * 제공되면 containerHeight를 자동으로 측정하고, window 모드에서 offset 계산에 사용됩니다.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * 아이템 간 간격 (px)
   * 자동 높이 측정 시 간격이 자동으로 추가됩니다.
   * @default 0
   */
  itemSpacing?: number;
  /**
   * 자동 높이 측정 활성화
   * true로 설정하면 각 아이템의 높이를 자동으로 측정합니다.
   * VirtualItem.ref를 사용하여 아이템 요소에 연결하세요.
   * @default false
   */
  measureItemHeight?: boolean;
  /**
   * 오버스캔 (화면 밖에 렌더링할 추가 아이템 개수)
   * @default 3
   */
  overscan?: number;
  /**
   * 스크롤 오프셋 (px)
   * @default 0
   */
  scrollOffset?: number;
  /**
   * 스크롤 타겟
   * - 'container': 특정 div 컨테이너 스크롤 (기본값)
   * - 'window': 전체 페이지 스크롤
   * @default 'container'
   */
  scrollTarget?: "container" | "window";
}

/**
 * useVirtualList 반환 타입
 */
export interface UseVirtualListReturn {
  /**
   * 현재 보이는 가상 아이템들
   */
  virtualItems: VirtualItem[];
  /**
   * 전체 리스트의 총 높이 (px)
   */
  totalHeight: number;
  /**
   * 컨테이너에 적용할 스타일
   */
  containerStyle: CSSProperties;
  /**
   * 스크롤 이벤트 핸들러
   * scrollTarget이 'container'일 때만 사용됩니다.
   */
  handleScroll?: (e: UIEvent<HTMLElement>) => void;
  /**
   * 스크롤 컨테이너 ref
   */
  scrollElementRef: RefObject<HTMLDivElement | null>;
}

/**
 * React hook for virtualized list rendering
 *
 * @param options - 가상화 옵션
 * @returns 가상화된 리스트 관련 데이터와 함수들
 */
export function useVirtualList(
  options: UseVirtualListOptions
): UseVirtualListReturn {
  const {
    itemCount,
    itemHeight,
    containerHeight: initialContainerHeight = 0,
    containerRef,
    itemSpacing = 0,
    measureItemHeight = false,
    overscan = 3,
    scrollOffset: initialScrollOffset = 0,
    scrollTarget = "container",
  } = options;

  if (
    scrollTarget === "container" &&
    !containerRef &&
    initialContainerHeight <= 0
  ) {
    throw new Error(
      "useVirtualList: Provide a positive containerHeight or containerRef when scrollTarget is 'container'."
    );
  }

  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 아이템 높이 측정
  const { itemHeights, createItemRef } = useItemHeightMeasurement({
    measureItemHeight,
    itemCount,
  });

  // 컨테이너 높이 측정
  const { containerHeight, getTargetElement } = useContainerHeight({
    scrollTarget,
    initialContainerHeight,
    containerRef,
    scrollElementRef,
  });

  // 스크롤 처리
  const { scrollOffset, handleScroll } = useScrollHandler({
    scrollTarget,
    initialScrollOffset,
    containerRef,
    scrollElementRef,
    getTargetElement,
  });

  // 아이템 위치 계산
  const { itemPositions, getItemHeight, totalHeight } = useItemPositions({
    itemCount,
    itemHeight,
    itemHeights,
    measureItemHeight,
    itemSpacing,
  });

  // 보이는 아이템 범위 계산
  const virtualItems = useMemo(() => {
    if (itemCount === 0) return [];

    const start = scrollOffset;
    const end = scrollOffset + containerHeight;

    // 이진 탐색으로 보이는 범위 찾기
    const { startIndex, endIndex } = findVisibleRange(
      start,
      end,
      itemCount,
      itemPositions,
      getItemHeight
    );

    // 가상 아이템 생성
    return createVirtualItems(
      startIndex,
      endIndex,
      overscan,
      itemCount,
      itemPositions,
      getItemHeight,
      createItemRef
    );
  }, [
    scrollOffset,
    containerHeight,
    itemCount,
    itemPositions,
    getItemHeight,
    overscan,
    createItemRef,
  ]);

  // 컨테이너 스타일
  const containerStyle: CSSProperties = useMemo(() => {
    // window 모드일 때는 스타일 적용 안 함 (전체 페이지 스크롤)
    if (scrollTarget === "window") {
      return {};
    }

    // container 모드일 때만 스타일 적용
    return {
      ...(containerRef ? {} : { height: containerHeight }),
      overflow: "auto",
      position: "relative",
    };
  }, [containerHeight, containerRef, scrollTarget]);

  return {
    virtualItems,
    totalHeight,
    containerStyle,
    handleScroll: scrollTarget === "container" ? handleScroll : undefined,
    scrollElementRef,
  };
}
