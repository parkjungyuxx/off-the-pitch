import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useVirtualList } from "./useVirtualList";
import { createRef } from "react";

// ResizeObserver 모킹
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

beforeEach(() => {
  // ResizeObserver를 클래스로 모킹
  class MockResizeObserver {
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;

    constructor(callback: ResizeObserverCallback) {
      // 생성자 추적은 필요시 추가
    }
  }

  window.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useVirtualList", () => {
  it("기본 옵션으로 가상 아이템을 생성해야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
      })
    );

    expect(result.current.virtualItems).toBeDefined();
    expect(Array.isArray(result.current.virtualItems)).toBe(true);
    expect(result.current.virtualItems.length).toBeGreaterThan(0);
  });

  it("virtualItems에 올바른 속성이 있어야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 5,
        itemHeight: 100,
        containerHeight: 300,
      })
    );

    if (result.current.virtualItems.length > 0) {
      const item = result.current.virtualItems[0];
      expect(item).toHaveProperty("index");
      expect(item).toHaveProperty("start");
      expect(item).toHaveProperty("size");
      expect(item).toHaveProperty("end");
      expect(item).toHaveProperty("ref");
      expect(typeof item.ref).toBe("function");
    }
  });

  it("totalHeight를 올바르게 계산해야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
      })
    );

    expect(result.current.totalHeight).toBe(1000); // 10 * 100
  });

  it("itemSpacing 옵션을 받아야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
        itemSpacing: 10,
      })
    );

    // itemSpacing은 measureItemHeight가 활성화된 경우에만 적용됨
    // 기본적으로는 아이템 높이만 계산됨
    expect(result.current.totalHeight).toBe(1000);
  });

  it("containerStyle을 올바르게 반환해야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
      })
    );

    expect(result.current.containerStyle).toBeDefined();
    expect(result.current.containerStyle.overflow).toBe("auto");
    expect(result.current.containerStyle.position).toBe("relative");
    expect(result.current.containerStyle.height).toBe(500);
  });

  it("scrollTarget이 'window'일 때 containerStyle이 비어있어야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
        scrollTarget: "window",
      })
    );

    expect(result.current.containerStyle).toEqual({});
  });

  it("scrollTarget이 'window'일 때 handleScroll이 undefined여야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
        scrollTarget: "window",
      })
    );

    expect(result.current.handleScroll).toBeUndefined();
  });

  it("scrollTarget이 'container'일 때 handleScroll이 있어야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
        scrollTarget: "container",
      })
    );

    expect(result.current.handleScroll).toBeDefined();
    expect(typeof result.current.handleScroll).toBe("function");
  });

  it("scrollElementRef를 반환해야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerHeight: 500,
      })
    );

    expect(result.current.scrollElementRef).toBeDefined();
  });

  it("itemCount가 0이면 빈 배열을 반환해야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 0,
        itemHeight: 100,
        containerHeight: 500,
      })
    );

    expect(result.current.virtualItems).toEqual([]);
    expect(result.current.totalHeight).toBe(0);
  });

  it("동적 높이 함수를 처리해야 함", () => {
    const getItemHeight = (index: number) => 50 + index * 10;

    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 5,
        itemHeight: getItemHeight,
        containerHeight: 500,
      })
    );

    expect(result.current.virtualItems.length).toBeGreaterThan(0);
    expect(result.current.totalHeight).toBeGreaterThan(0);
  });

  it("overscan 옵션을 적용해야 함", () => {
    const { result: resultWithoutOverscan } = renderHook(() =>
      useVirtualList({
        itemCount: 100,
        itemHeight: 100,
        containerHeight: 500,
        overscan: 0,
      })
    );

    const { result: resultWithOverscan } = renderHook(() =>
      useVirtualList({
        itemCount: 100,
        itemHeight: 100,
        containerHeight: 500,
        overscan: 5,
      })
    );

    // overscan이 있으면 더 많은 아이템이 렌더링됨
    expect(resultWithOverscan.current.virtualItems.length).toBeGreaterThan(
      resultWithoutOverscan.current.virtualItems.length
    );
  });

  it("containerRef가 제공되면 containerHeight를 자동 측정해야 함", async () => {
    const containerRef = createRef<HTMLDivElement>();
    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "offsetHeight", {
      value: 600,
      configurable: true,
    });
    containerRef.current = mockElement;

    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 10,
        itemHeight: 100,
        containerRef,
      })
    );

    await waitFor(() => {
      expect(result.current.containerStyle).toBeDefined();
    });
  });

  it("scrollTarget이 'container'이고 containerHeight도 containerRef도 없으면 에러를 던져야 함", () => {
    expect(() => {
      renderHook(() =>
        useVirtualList({
          itemCount: 10,
          itemHeight: 100,
          scrollTarget: "container",
        })
      );
    }).toThrow(
      "useVirtualList: Provide a positive containerHeight or containerRef when scrollTarget is 'container'."
    );
  });

  it("scrollOffset 옵션을 적용해야 함", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        itemCount: 100,
        itemHeight: 100,
        containerHeight: 500,
        scrollOffset: 1000,
      })
    );

    // scrollOffset이 적용되면 다른 아이템들이 보임
    expect(result.current.virtualItems.length).toBeGreaterThan(0);
  });
});
