/**
 * rootMargin 값을 계산하는 함수
 * direction에 따라 상단/하단에 threshold를 적용
 *
 * @param direction - 스크롤 방향
 * @param threshold - 트리거 거리 (px)
 * @param rootMargin - 기본 rootMargin 값
 * @returns 계산된 rootMargin 문자열
 */
export function calculateRootMargin(
  direction: "up" | "down",
  threshold: number,
  rootMargin: string
): string {
  // rootMargin 형식: "top right bottom left"
  return direction === "up"
    ? `${threshold}px ${rootMargin} 0px ${rootMargin}` // 상단에 threshold
    : `0px ${rootMargin} ${threshold}px ${rootMargin}`; // 하단에 threshold
}

/**
 * IntersectionObserver 옵션을 생성하는 함수
 *
 * @param root - 스크롤 컨테이너 요소
 * @param rootMargin - rootMargin 값
 * @returns IntersectionObserverInit 옵션
 */
export function createObserverOptions(
  root: HTMLElement | null,
  rootMargin: string
): IntersectionObserverInit {
  return {
    root: root || null,
    rootMargin,
    threshold: 0,
  };
}
