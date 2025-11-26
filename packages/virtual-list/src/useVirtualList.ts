import {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
  type CSSProperties,
  type UIEvent,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
   */
  itemHeight: number | ((index: number) => number);
  /**
   * 컨테이너의 높이 (px)
   * containerRef가 제공되면 자동으로 측정되며, 이 값은 초기값으로 사용됩니다.
   */
  containerHeight?: number;
  /**
   * 컨테이너 요소의 ref (자동 높이 측정용)
   * 제공되면 containerHeight를 자동으로 측정합니다.
   */
  containerRef?: RefObject<HTMLElement>;
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

  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
  const [measuredHeight, setMeasuredHeight] = useState(initialContainerHeight);
  const [windowHeight, setWindowHeight] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerHeight;
    }
    return initialContainerHeight > 0 ? initialContainerHeight : 0;
  });
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // scrollTarget에 따라 containerHeight 결정
  const containerHeight =
    scrollTarget === "window"
      ? windowHeight
      : containerRef
      ? measuredHeight
      : initialContainerHeight;

  // containerRef 또는 scrollElementRef를 통한 자동 높이 측정 (container 모드일 때만)
  useEffect(() => {
    if (scrollTarget !== "container") return;

    // containerRef가 있으면 그것을 사용, 없으면 scrollElementRef 사용
    const targetRef = containerRef?.current || scrollElementRef.current;
    if (!targetRef) return;

    const updateHeight = () => {
      const currentRef = containerRef?.current || scrollElementRef.current;
      const height = currentRef?.clientHeight ?? 0;
      if (height > 0) {
        setMeasuredHeight(height);
      }
    };

    // 초기 높이 측정
    updateHeight();

    // ResizeObserver로 크기 변경 감지
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setMeasuredHeight(height);
        }
      }
    });

    resizeObserver.observe(targetRef);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, scrollTarget]);

  // window 모드일 때 window 크기 측정
  useIsomorphicLayoutEffect(() => {
    if (scrollTarget !== "window" || typeof window === "undefined") return;

    const updateWindowHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    // 초기 높이 측정
    updateWindowHeight();

    // ResizeObserver로 window 크기 변경 감지
    const handleResize = () => {
      updateWindowHeight();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollTarget]);

  // 아이템 높이 계산 함수
  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // 각 아이템의 시작 위치 계산
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

  // 보이는 아이템 범위 계산
  const virtualItems = useMemo(() => {
    if (itemCount === 0) return [];

    const start = scrollOffset;
    const end = scrollOffset + containerHeight;

    // 이진 탐색으로 시작 인덱스 찾기
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
      });
    }

    return items;
  }, [
    scrollOffset,
    containerHeight,
    itemCount,
    itemPositions,
    getItemHeight,
    overscan,
  ]);

  // 컨테이너 스크롤 핸들러 (requestAnimationFrame으로 최적화)
  const handleScroll = useCallback(
    (e: UIEvent<HTMLElement>) => {
      if (scrollTarget !== "container") return;

      const target = e.currentTarget;
      const newScrollOffset = target.scrollTop;

      // 이전 requestAnimationFrame 취소
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // requestAnimationFrame으로 다음 프레임에 업데이트
      rafIdRef.current = requestAnimationFrame(() => {
        setScrollOffset(newScrollOffset);
        rafIdRef.current = null;
      });
    },
    [scrollTarget]
  );

  // window 스크롤 이벤트 처리 (requestAnimationFrame으로 최적화)
  useEffect(() => {
    if (scrollTarget !== "window") return;

    const handleWindowScroll = () => {
      const newScrollOffset =
        window.scrollY || document.documentElement.scrollTop;

      // 이전 requestAnimationFrame 취소
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // requestAnimationFrame으로 다음 프레임에 업데이트
      rafIdRef.current = requestAnimationFrame(() => {
        setScrollOffset(newScrollOffset);
        rafIdRef.current = null;
      });
    };

    // 초기 스크롤 위치 설정
    handleWindowScroll();

    // 스크롤 이벤트 리스너 추가 (passive: true로 성능 최적화)
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [scrollTarget]);

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

  // 외부 scrollOffset 변경 감지
  useEffect(() => {
    if (initialScrollOffset !== scrollOffset) {
      setScrollOffset(initialScrollOffset);
    }
  }, [initialScrollOffset]);

  return {
    virtualItems,
    totalHeight,
    containerStyle,
    handleScroll: scrollTarget === "container" ? handleScroll : undefined,
    scrollElementRef,
  };
}
