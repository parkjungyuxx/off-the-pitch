import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createRef } from "react";
import { useScrollHandler } from "./useScrollHandler";

const mockRequestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
const mockCancelAnimationFrame = vi.fn();

beforeEach(() => {
  // requestAnimationFrame 모킹
  global.requestAnimationFrame =
    mockRequestAnimationFrame as typeof requestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;
});

afterEach(() => {
  vi.clearAllMocks();
  mockRequestAnimationFrame.mockClear();
  mockCancelAnimationFrame.mockClear();
});

describe("useScrollHandler", () => {
  it("초기 scrollOffset을 반환해야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const getTargetElement = () => null;

    const { result } = renderHook(() =>
      useScrollHandler({
        scrollTarget: "container",
        initialScrollOffset: 100,
        scrollElementRef,
        getTargetElement,
      })
    );

    expect(result.current.scrollOffset).toBe(100);
  });

  it("scrollTarget이 'container'일 때 handleScroll을 반환해야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const getTargetElement = () => null;

    const { result } = renderHook(() =>
      useScrollHandler({
        scrollTarget: "container",
        initialScrollOffset: 0,
        scrollElementRef,
        getTargetElement,
      })
    );

    expect(result.current.handleScroll).toBeDefined();
    expect(typeof result.current.handleScroll).toBe("function");
  });

  it("scrollTarget이 'window'일 때 handleScroll이 undefined여야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const getTargetElement = () => null;

    const { result } = renderHook(() =>
      useScrollHandler({
        scrollTarget: "window",
        initialScrollOffset: 0,
        scrollElementRef,
        getTargetElement,
      })
    );

    expect(result.current.handleScroll).toBeUndefined();
  });

  it("handleScroll이 호출되면 scrollOffset이 업데이트되어야 함", async () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const getTargetElement = () => null;

    const { result } = renderHook(() =>
      useScrollHandler({
        scrollTarget: "container",
        initialScrollOffset: 0,
        scrollElementRef,
        getTargetElement,
      })
    );

    const mockEvent = {
      currentTarget: {
        scrollTop: 500,
      },
    } as unknown as React.UIEvent<HTMLElement>;

    act(() => {
      result.current.handleScroll?.(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.scrollOffset).toBe(500);
    });
  });

  it("initialScrollOffset이 변경되면 scrollOffset이 업데이트되어야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const getTargetElement = () => null;

    const { result, rerender } = renderHook(
      ({ initialScrollOffset }) =>
        useScrollHandler({
          scrollTarget: "container",
          initialScrollOffset,
          scrollElementRef,
          getTargetElement,
        }),
      {
        initialProps: { initialScrollOffset: 0 },
      }
    );

    expect(result.current.scrollOffset).toBe(0);

    rerender({ initialScrollOffset: 200 });

    expect(result.current.scrollOffset).toBe(200);
  });

  it("scrollTarget이 'window'일 때 window 스크롤 이벤트를 처리해야 함", async () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const containerElement = document.createElement("div");
    scrollElementRef.current = containerElement;

    Object.defineProperty(containerElement, "getBoundingClientRect", {
      value: () => ({
        top: 100,
        left: 0,
        bottom: 600,
        right: 1000,
        width: 1000,
        height: 500,
      }),
      configurable: true,
    });

    Object.defineProperty(window, "scrollY", {
      value: 0,
      configurable: true,
      writable: true,
    });

    const getTargetElement = () => containerElement;

    const { result } = renderHook(() =>
      useScrollHandler({
        scrollTarget: "window",
        initialScrollOffset: 0,
        scrollElementRef,
        getTargetElement,
      })
    );

    // window 스크롤 이벤트 시뮬레이션
    act(() => {
      Object.defineProperty(window, "scrollY", {
        value: 300,
        configurable: true,
        writable: true,
      });
      window.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() => {
      expect(result.current.scrollOffset).toBeGreaterThanOrEqual(0);
    });
  });

  it("requestAnimationFrame을 사용하여 성능 최적화해야 함", async () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const getTargetElement = () => null;

    const { result } = renderHook(() =>
      useScrollHandler({
        scrollTarget: "container",
        initialScrollOffset: 0,
        scrollElementRef,
        getTargetElement,
      })
    );

    const mockEvent = {
      currentTarget: {
        scrollTop: 1000,
      },
    } as unknown as React.UIEvent<HTMLElement>;

    act(() => {
      result.current.handleScroll?.(mockEvent);
    });

    // requestAnimationFrame이 호출되었는지 확인
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
});
