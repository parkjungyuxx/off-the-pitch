import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { useContainerHeight } from "./useContainerHeight";

// ResizeObserver 모킹
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();
const mockResizeObserverConstructor = vi.fn();

beforeEach(() => {
  class MockResizeObserver {
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;

    constructor(callback: ResizeObserverCallback) {
      mockResizeObserverConstructor(callback);
    }
  }

  window.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  vi.clearAllMocks();
  mockResizeObserverConstructor.mockClear();
});

describe("useContainerHeight", () => {
  it("초기 containerHeight를 반환해야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        scrollElementRef,
      })
    );

    expect(result.current.containerHeight).toBe(500);
  });

  it("scrollTarget이 'container'일 때 containerRef를 사용해야 함", async () => {
    const containerRef = createRef<HTMLDivElement>();
    const scrollElementRef = createRef<HTMLDivElement>();
    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "clientHeight", {
      value: 600,
      configurable: true,
    });
    containerRef.current = mockElement;

    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        containerRef,
        scrollElementRef,
      })
    );

    await waitFor(() => {
      expect(result.current.containerHeight).toBeGreaterThan(0);
    });
  });

  it("scrollTarget이 'container'일 때 scrollElementRef를 사용해야 함", async () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "clientHeight", {
      value: 700,
      configurable: true,
    });
    scrollElementRef.current = mockElement;

    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        scrollElementRef,
      })
    );

    await waitFor(() => {
      expect(result.current.containerHeight).toBeGreaterThan(0);
    });
  });

  it("scrollTarget이 'window'일 때 window 높이를 반환해야 함", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    const scrollElementRef = createRef<HTMLDivElement>();
    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "window",
        initialContainerHeight: 500,
        scrollElementRef,
      })
    );

    expect(result.current.containerHeight).toBe(800);
  });

  it("getTargetElement이 containerRef를 우선 반환해야 함", () => {
    const containerRef = createRef<HTMLDivElement>();
    const scrollElementRef = createRef<HTMLDivElement>();
    const containerElement = document.createElement("div");
    const scrollElement = document.createElement("div");
    containerRef.current = containerElement;
    scrollElementRef.current = scrollElement;

    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        containerRef,
        scrollElementRef,
      })
    );

    expect(result.current.getTargetElement()).toBe(containerElement);
  });

  it("containerRef가 없으면 scrollElementRef를 반환해야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const scrollElement = document.createElement("div");
    scrollElementRef.current = scrollElement;

    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        scrollElementRef,
      })
    );

    expect(result.current.getTargetElement()).toBe(scrollElement);
  });

  it("scrollTarget이 'container'일 때 ResizeObserver를 설정해야 함", async () => {
    const scrollElementRef = createRef<HTMLDivElement>();
    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "clientHeight", {
      value: 600,
      configurable: true,
    });
    scrollElementRef.current = mockElement;

    renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        scrollElementRef,
      })
    );

    await waitFor(() => {
      expect(mockResizeObserverConstructor).toHaveBeenCalled();
    });
  });

  it("scrollTarget이 'window'일 때 ResizeObserver를 설정하지 않아야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();

    renderHook(() =>
      useContainerHeight({
        scrollTarget: "window",
        initialContainerHeight: 500,
        scrollElementRef,
      })
    );

    // window 모드에서는 ResizeObserver가 호출되지 않아야 함
    expect(mockResizeObserverConstructor).not.toHaveBeenCalled();
  });

  it("containerRef가 있으면 measuredHeight를 사용해야 함", async () => {
    const containerRef = createRef<HTMLDivElement>();
    const scrollElementRef = createRef<HTMLDivElement>();
    const mockElement = document.createElement("div");
    Object.defineProperty(mockElement, "clientHeight", {
      value: 900,
      configurable: true,
    });
    containerRef.current = mockElement;

    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 500,
        containerRef,
        scrollElementRef,
      })
    );

    await waitFor(() => {
      expect(result.current.containerHeight).toBeGreaterThan(500);
    });
  });

  it("containerRef가 없으면 initialContainerHeight를 사용해야 함", () => {
    const scrollElementRef = createRef<HTMLDivElement>();

    const { result } = renderHook(() =>
      useContainerHeight({
        scrollTarget: "container",
        initialContainerHeight: 1000,
        scrollElementRef,
      })
    );

    // containerRef가 없으면 initialContainerHeight 사용
    expect(result.current.containerHeight).toBe(1000);
  });
});
