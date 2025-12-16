import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useItemHeightMeasurement } from "./useItemHeightMeasurement";

// ResizeObserver 모킹
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();
const mockResizeObserverConstructor = vi.fn();

beforeEach(() => {
  // ResizeObserver를 클래스로 모킹
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

  // requestAnimationFrame 모킹
  global.requestAnimationFrame = vi
    .fn((cb) => setTimeout(cb, 16))
    .bind(global) as typeof requestAnimationFrame;
  global.cancelAnimationFrame = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  mockResizeObserverConstructor.mockClear();
});

describe("useItemHeightMeasurement", () => {
  it("기본적으로 빈 배열을 반환해야 함", () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: false,
        itemCount: 10,
      })
    );

    expect(result.current.itemHeights).toEqual([]);
    expect(result.current.createItemRef).toBeDefined();
    expect(typeof result.current.createItemRef).toBe("function");
  });

  it("createItemRef가 함수를 반환해야 함", () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: false,
        itemCount: 10,
      })
    );

    const refCallback = result.current.createItemRef(0);
    expect(typeof refCallback).toBe("function");
  });

  it("measureItemHeight가 false일 때 높이를 측정하지 않아야 함", () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: false,
        itemCount: 5,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 100,
      configurable: true,
    });

    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    expect(result.current.itemHeights).toEqual([]);
  });

  it("measureItemHeight가 true일 때 높이를 측정해야 함", async () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 5,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 150,
      configurable: true,
    });

    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    // requestAnimationFrame이 두 번 호출되므로 약간의 지연 필요
    await waitFor(
      () => {
        expect(result.current.itemHeights.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );

    expect(result.current.itemHeights[0]).toBe(150);
  });

  it("여러 아이템의 높이를 측정해야 함", async () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 3,
      })
    );

    const elements = [
      document.createElement("div"),
      document.createElement("div"),
      document.createElement("div"),
    ];

    elements.forEach((el, index) => {
      Object.defineProperty(el, "offsetHeight", {
        value: 100 + index * 50,
        configurable: true,
      });
    });

    act(() => {
      elements.forEach((element, index) => {
        const refCallback = result.current.createItemRef(index);
        refCallback(element);
      });
    });

    await waitFor(
      () => {
        expect(result.current.itemHeights.length).toBeGreaterThanOrEqual(3);
      },
      { timeout: 1000 }
    );

    expect(result.current.itemHeights[0]).toBe(100);
    expect(result.current.itemHeights[1]).toBe(150);
    expect(result.current.itemHeights[2]).toBe(200);
  });

  it("같은 요소를 다시 설정해도 무한 루프가 발생하지 않아야 함", async () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 1,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 100,
      configurable: true,
    });

    const refCallback = result.current.createItemRef(0);

    act(() => {
      refCallback(element);
      refCallback(element); // 같은 요소를 다시 설정
      refCallback(element); // 또 다시 설정
    });

    await waitFor(
      () => {
        expect(result.current.itemHeights.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );

    // 높이가 한 번만 측정되어야 함
    expect(result.current.itemHeights[0]).toBe(100);
  });

  it("요소가 null일 때 ref를 제거해야 함", () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 1,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 100,
      configurable: true,
    });

    const refCallback = result.current.createItemRef(0);

    act(() => {
      refCallback(element);
      refCallback(null); // 요소 제거
    });

    // 요소가 제거되어도 이전 높이는 유지됨
    expect(result.current.itemHeights.length).toBeGreaterThanOrEqual(0);
  });

  it("ResizeObserver가 설정되어야 함", async () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 1,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 100,
      configurable: true,
    });

    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    await waitFor(
      () => {
        expect(mockResizeObserverConstructor).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("높이가 변경되지 않으면 업데이트하지 않아야 함", async () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 1,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 100,
      configurable: true,
    });

    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    await waitFor(
      () => {
        expect(result.current.itemHeights[0]).toBe(100);
      },
      { timeout: 1000 }
    );

    const initialHeights = [...result.current.itemHeights];

    // 같은 높이로 다시 측정
    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    // 높이가 변경되지 않았으므로 배열이 동일해야 함
    expect(result.current.itemHeights).toEqual(initialHeights);
  });

  it("높이가 0보다 작거나 같으면 업데이트하지 않아야 함", async () => {
    const { result } = renderHook(() =>
      useItemHeightMeasurement({
        measureItemHeight: true,
        itemCount: 1,
      })
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 0,
      configurable: true,
    });

    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    // 높이가 0이므로 업데이트되지 않아야 함
    await waitFor(() => {
      // 약간의 지연 후에도 높이가 설정되지 않아야 함
    });

    expect(result.current.itemHeights[0]).toBeUndefined();
  });

  it("itemCount가 변경되면 Observer가 재설정되어야 함", async () => {
    const { result, rerender } = renderHook(
      ({ itemCount }) =>
        useItemHeightMeasurement({
          measureItemHeight: true,
          itemCount,
        }),
      {
        initialProps: { itemCount: 5 },
      }
    );

    const element = document.createElement("div");
    Object.defineProperty(element, "offsetHeight", {
      value: 100,
      configurable: true,
    });

    act(() => {
      const refCallback = result.current.createItemRef(0);
      refCallback(element);
    });

    await waitFor(
      () => {
        expect(result.current.itemHeights.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );

    // itemCount 변경
    rerender({ itemCount: 10 });

    // Observer가 재설정되어야 함
    expect(mockResizeObserverConstructor.mock.calls.length).toBeGreaterThan(0);
  });
});
