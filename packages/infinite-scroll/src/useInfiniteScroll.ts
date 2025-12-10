import { useRef, RefObject, useCallback, useEffect } from "react";
import { calculateRootMargin, createObserverOptions } from "./utils";

/**
 * 무한 스크롤을 위한 옵션 타입
 */
export interface UseInfiniteScrollOptions {
  /**
   * 다음 페이지를 로드하는 함수
   */
  loadMore: () => void | Promise<void>;
  /**
   * 더 이상 로드할 데이터가 없을 때 true
   * @default false
   */
  hasMore?: boolean;
  /**
   * 현재 로딩 중일 때 true
   * @default false
   */
  isLoading?: boolean;
  /**
   * 다음 페이지를 로드할 트리거가 되는 거리 (px)
   * @default 100
   */
  threshold?: number;
  /**
   * 스크롤 방향
   * - "down": 하단 스크롤 (리스트 하단에 도달 시 다음 페이지 로드)
   * - "up": 상단 스크롤 (리스트 상단에 도달 시 이전 페이지 로드)
   * @default "down"
   */
  direction?: "up" | "down";
  /**
   * 스크롤 컨테이너 요소 (기본값: window)
   */
  root?: HTMLElement | null;
  /**
   * Intersection Observer의 rootMargin
   * @default "0px"
   */
  rootMargin?: string;
}

/**
 * useInfiniteScroll 훅의 반환 타입
 */
export interface UseInfiniteScrollReturn {
  /**
   * 스크롤을 감지할 요소에 연결할 ref
   * - direction이 "down"일 때: 리스트 하단에 배치
   * - direction이 "up"일 때: 리스트 상단에 배치
   */
  sentinelRef: RefObject<HTMLDivElement | null>;
  /**
   * 수동으로 다음 페이지 로드
   */
  loadMore: () => void;
}

/**
 * React hook for infinite scroll functionality
 *
 * @param options - 무한 스크롤 옵션
 * @returns 무한 스크롤 관련 ref와 함수들
 */
export function useInfiniteScroll(
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn {
  // 옵션에서 값 추출 및 기본값 설정
  const {
    loadMore: loadMoreFn,
    hasMore = true,
    isLoading = false,
    threshold = 100,
    direction = "down",
    root = null,
    rootMargin = "0px",
  } = options;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    // 더 이상 불러올 데이터가 없거나 로딩 중이면 실행하지 않음
    if (!hasMore || isLoading) {
      return;
    }

    // loadMoreFn 호출 (Promise일 수 있으므로 await)
    await loadMoreFn();
  }, [loadMoreFn, hasMore, isLoading]);

  // Intersection Observer 설정
  useEffect(() => {
    // 더 이상 불러올 데이터가 없거나 로딩 중이면 Observer를 설정하지 않음
    if (!hasMore || isLoading) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    // Intersection Observer 옵션 설정
    const rootMarginValue = calculateRootMargin(
      direction,
      threshold,
      rootMargin
    );
    const observerOptions = createObserverOptions(root, rootMarginValue);

    // Intersection Observer 생성
    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      // sentinel이 화면에 보이면 loadMore 호출
      if (entry.isIntersecting) {
        loadMore();
      }
    }, observerOptions);

    // sentinel 요소 관찰 시작
    observerRef.current.observe(sentinel);

    // cleanup: 컴포넌트 언마운트 시 Observer 해제
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore, root, rootMargin, threshold, direction]);

  return {
    sentinelRef,
    loadMore,
  };
}
