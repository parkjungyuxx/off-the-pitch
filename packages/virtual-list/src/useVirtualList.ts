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

  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
  const [measuredHeight, setMeasuredHeight] = useState(initialContainerHeight);
  const [windowHeight, setWindowHeight] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerHeight;
    }
    return initialContainerHeight > 0 ? initialContainerHeight : 0;
  });
  // 배열로 관리하여 인덱스 기반 접근이 더 직관적이고 React가 변경을 잘 감지함
  const [itemHeights, setItemHeights] = useState<(number | undefined)[]>([]);
  const itemRefsMap = useRef<Map<number, HTMLElement>>(new Map());
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const containerOffsetRef = useRef<number>(0); // 컨테이너의 초기 offset 저장

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

  // 아이템 높이 측정 함수
  const measureItemHeightAtIndex = useCallback((index: number, element: HTMLElement) => {
    const height = element.offsetHeight;
    if (height > 0) {
      setItemHeights((prev) => {
        // 배열 크기가 부족하면 확장
        const newHeights = [...prev];
        while (newHeights.length <= index) {
          newHeights.push(undefined);
        }
        
        const currentHeight = newHeights[index];
        // 높이가 변경되지 않았으면 업데이트하지 않음 (불필요한 리렌더링 방지)
        if (currentHeight !== undefined && Math.abs(currentHeight - height) < 1) {
          return prev; // 변경 없음
        }
        
        // 새로운 배열을 생성하여 React가 변경을 감지하도록 함
        newHeights[index] = height;
        return newHeights;
      });
    }
  }, []);

  // 아이템 높이 자동 측정 (measureItemHeight가 true인 경우)
  useEffect(() => {
    if (!measureItemHeight) return;

    const observers: ResizeObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    itemRefsMap.current.forEach((element, index) => {
      if (!element || observedElements.has(element)) return;

      observedElements.add(element);

      // 즉시 높이 측정
      measureItemHeightAtIndex(index, element);

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const height = element.offsetHeight || entry.contentRect.height;
          if (height > 0) {
            setItemHeights((prev) => {
              // 배열 크기가 부족하면 확장
              const newHeights = [...prev];
              while (newHeights.length <= index) {
                newHeights.push(undefined);
              }
              
              const currentHeight = newHeights[index];
              // 높이가 변경되지 않았으면 업데이트하지 않음
              if (currentHeight !== undefined && Math.abs(currentHeight - height) < 1) {
                return prev;
              }
              
              // 새로운 배열을 생성하여 React가 변경을 감지하도록 함
              newHeights[index] = height;
              return newHeights;
            });
          }
        }
      });

      observer.observe(element);
      observers.push(observer);
    });

    // 약간의 지연 후 새로 추가된 요소도 측정
    const timeoutId = setTimeout(() => {
      itemRefsMap.current.forEach((element, index) => {
        if (!element || observedElements.has(element)) return;

        observedElements.add(element);
        measureItemHeightAtIndex(index, element);

        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const element = entry.target as HTMLElement;
            const height = element.offsetHeight || entry.contentRect.height;
            if (height > 0) {
              setItemHeights((prev) => {
                // 배열 크기가 부족하면 확장
                const newHeights = [...prev];
                while (newHeights.length <= index) {
                  newHeights.push(undefined);
                }
                
                const currentHeight = newHeights[index];
                if (currentHeight !== undefined && Math.abs(currentHeight - height) < 1) {
                  return prev;
                }
                
                newHeights[index] = height;
                return newHeights;
              });
            }
          }
        });

        observer.observe(element);
        observers.push(observer);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [measureItemHeight, itemCount, measureItemHeightAtIndex]);

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
        const hadElement = itemRefsMap.current.has(index);
        itemRefsMap.current.delete(index);
        // 요소 삭제 시 높이도 삭제하지 않음 (이전 높이를 유지하여 안정성 확보)
        // 높이는 ResizeObserver가 자동으로 업데이트하거나, 새 요소가 설정될 때 업데이트됨
      }
    },
    [measureItemHeight, measureItemHeightAtIndex]
  );

  // 아이템 높이 계산 함수 (itemHeights를 직접 참조)
  // 배열을 사용하므로 React가 변경을 자동으로 감지함
  const itemPositions = useMemo(() => {
    const getItemHeight = (index: number): number => {
      // measureItemHeight가 활성화되고 해당 인덱스의 높이가 측정된 경우
      if (measureItemHeight && index < itemHeights.length && itemHeights[index] !== undefined) {
        const measuredHeight = itemHeights[index]!;
        return measuredHeight + itemSpacing;
      }
      // 그 외의 경우 기존 로직 사용
      const baseHeight =
        typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
      return baseHeight;
    };

    const positions: number[] = [0];
    for (let i = 1; i < itemCount; i++) {
      positions[i] = positions[i - 1] + getItemHeight(i - 1);
    }
    return positions;
  }, [itemCount, itemHeight, itemHeights, measureItemHeight, itemSpacing]);

  // getItemHeight 함수 (외부에서도 사용하기 위해)
  const getItemHeight = useCallback(
    (index: number): number => {
      // measureItemHeight가 활성화되고 해당 인덱스의 높이가 측정된 경우
      if (measureItemHeight && index < itemHeights.length && itemHeights[index] !== undefined) {
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
        ref: createItemRef(i),
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

    // 컨테이너의 초기 offset 측정 (한 번만)
    const updateContainerOffset = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const baseScrollOffset =
          window.scrollY || document.documentElement.scrollTop;
        containerOffsetRef.current = rect.top + baseScrollOffset;
      } else if (scrollElementRef.current) {
        const rect = scrollElementRef.current.getBoundingClientRect();
        const baseScrollOffset =
          window.scrollY || document.documentElement.scrollTop;
        containerOffsetRef.current = rect.top + baseScrollOffset;
      }
    };

    const handleWindowScroll = () => {
      const baseScrollOffset =
        window.scrollY || document.documentElement.scrollTop;
      
      // 컨테이너 시작 위치를 기준으로 한 상대 스크롤 오프셋
      const newScrollOffset = Math.max(0, baseScrollOffset - containerOffsetRef.current);

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

    // 초기 컨테이너 offset 측정
    updateContainerOffset();
    
    // 초기 스크롤 위치 설정
    handleWindowScroll();

    // 스크롤 이벤트 리스너 추가 (passive: true로 성능 최적화)
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    
    // 리사이즈 이벤트도 감지 (컨테이너 위치가 변경될 수 있음)
    const handleResize = () => {
      updateContainerOffset();
      handleWindowScroll();
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [scrollTarget, containerRef]);

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
