import { useRef, useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * 스크롤 핸들러 옵션
 */
interface UseScrollHandlerOptions {
  /**
   * 스크롤 타겟
   */
  scrollTarget: "container" | "window";
  /**
   * 초기 스크롤 오프셋
   */
  initialScrollOffset: number;
  /**
   * 컨테이너 ref
   */
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * 스크롤 요소 ref
   */
  scrollElementRef: RefObject<HTMLDivElement | null>;
  /**
   * 타겟 요소를 가져오는 함수
   */
  getTargetElement: () => HTMLElement | null;
}

/**
 * 스크롤 핸들러 훅 반환값
 */
export interface UseScrollHandlerReturn {
  /**
   * 현재 스크롤 오프셋
   */
  scrollOffset: number;
  /**
   * 컨테이너 스크롤 핸들러
   */
  handleScroll?: (e: React.UIEvent<HTMLElement>) => void;
}

/**
 * 스크롤 이벤트를 처리하고 오프셋을 관리하는 훅
 */
export function useScrollHandler({
  scrollTarget,
  initialScrollOffset,
  containerRef,
  scrollElementRef,
  getTargetElement,
}: UseScrollHandlerOptions): UseScrollHandlerReturn {
  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
  const rafIdRef = useRef<number | null>(null);
  const containerOffsetRef = useRef<number>(0); // 컨테이너의 초기 offset 저장

  // requestAnimationFrame으로 스크롤 오프셋 업데이트 (성능 최적화)
  const updateScrollOffsetWithRaf = useCallback((newScrollOffset: number) => {
    // 이전 requestAnimationFrame 취소
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // requestAnimationFrame으로 다음 프레임에 업데이트
    rafIdRef.current = requestAnimationFrame(() => {
      setScrollOffset(newScrollOffset);
      rafIdRef.current = null;
    });
  }, []);

  // 컨테이너 스크롤 핸들러 (requestAnimationFrame으로 최적화)
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      if (scrollTarget !== "container") return;

      const target = e.currentTarget;
      const newScrollOffset = target.scrollTop;
      updateScrollOffsetWithRaf(newScrollOffset);
    },
    [scrollTarget, updateScrollOffsetWithRaf]
  );

  // window 스크롤 이벤트 처리 (requestAnimationFrame으로 최적화)
  useEffect(() => {
    if (scrollTarget !== "window") return;

    // 컨테이너의 초기 offset 측정 (한 번만)
    const updateContainerOffset = () => {
      const targetElement = getTargetElement();
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const baseScrollOffset =
          window.scrollY || document.documentElement.scrollTop;
        containerOffsetRef.current = rect.top + baseScrollOffset;
      }
    };

    const handleWindowScroll = () => {
      const baseScrollOffset =
        window.scrollY || document.documentElement.scrollTop;

      // 컨테이너 시작 위치를 기준으로 한 상대 스크롤 오프셋
      const newScrollOffset = Math.max(
        0,
        baseScrollOffset - containerOffsetRef.current
      );

      updateScrollOffsetWithRaf(newScrollOffset);
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
  }, [scrollTarget, getTargetElement, updateScrollOffsetWithRaf]);

  // 외부 scrollOffset 변경 감지 (외부에서 scrollOffset prop이 변경되면 내부 state 업데이트)
  // scrollOffset을 의존성에 포함하지 않음: setScrollOffset 호출 시 scrollOffset이 변경되지만,
  // 이는 initialScrollOffset 변경에 대한 반응이므로 무한 루프를 방지하기 위해 제외
  useEffect(() => {
    // initialScrollOffset이 변경되었고, 현재 scrollOffset과 다르면 업데이트
    if (initialScrollOffset !== scrollOffset) {
      setScrollOffset(initialScrollOffset);
    }
  }, [initialScrollOffset]);

  return {
    scrollOffset,
    handleScroll: scrollTarget === "container" ? handleScroll : undefined,
  };
}
