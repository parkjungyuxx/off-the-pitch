import {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import type { RefObject } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * 컨테이너 높이 측정 옵션
 */
interface UseContainerHeightOptions {
  /**
   * 스크롤 타겟
   */
  scrollTarget: "container" | "window";
  /**
   * 초기 컨테이너 높이
   */
  initialContainerHeight: number;
  /**
   * 컨테이너 ref
   */
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * 스크롤 요소 ref
   */
  scrollElementRef: RefObject<HTMLDivElement | null>;
}

/**
 * 컨테이너 높이 측정 훅 반환값
 */
export interface UseContainerHeightReturn {
  /**
   * 계산된 컨테이너 높이
   */
  containerHeight: number;
  /**
   * 컨테이너 ref 선택 헬퍼 함수
   */
  getTargetElement: () => HTMLElement | null;
}

/**
 * 컨테이너 높이를 자동으로 측정하고 계산하는 훅
 */
export function useContainerHeight({
  scrollTarget,
  initialContainerHeight,
  containerRef,
  scrollElementRef,
}: UseContainerHeightOptions): UseContainerHeightReturn {
  const [measuredHeight, setMeasuredHeight] = useState(initialContainerHeight);
  const [windowHeight, setWindowHeight] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerHeight;
    }
    return initialContainerHeight > 0 ? initialContainerHeight : 0;
  });

  // 컨테이너 ref 선택 헬퍼 함수 (containerRef 우선, 없으면 scrollElementRef 사용)
  const getTargetElement = useCallback((): HTMLElement | null => {
    return containerRef?.current || scrollElementRef.current;
  }, [containerRef, scrollElementRef]);

  // containerRef 또는 scrollElementRef를 통한 자동 높이 측정 (container 모드일 때만)
  useEffect(() => {
    if (scrollTarget !== "container") return;

    const targetRef = getTargetElement();
    if (!targetRef) return;

    const updateHeight = () => {
      const currentRef = getTargetElement();
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
  }, [scrollTarget, getTargetElement]);

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

  // scrollTarget에 따라 containerHeight 계산
  const containerHeight = useMemo(() => {
    if (scrollTarget === "window") {
      return windowHeight;
    }
    // container 모드
    if (containerRef) {
      return measuredHeight;
    }
    return initialContainerHeight;
  }, [
    scrollTarget,
    windowHeight,
    containerRef,
    measuredHeight,
    initialContainerHeight,
  ]);

  return {
    containerHeight,
    getTargetElement,
  };
}
