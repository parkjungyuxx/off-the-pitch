import { useRef, RefObject } from "react";

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
  // TODO: 로직 구현
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = () => {
    // TODO: loadMore 로직 구현
  };

  return {
    sentinelRef,
    loadMore,
  };
}
