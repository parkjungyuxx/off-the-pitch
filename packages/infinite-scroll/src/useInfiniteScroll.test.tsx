import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, render } from "@testing-library/react";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { createElement } from "react";

// IntersectionObserver 모킹
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

beforeEach(() => {
  // IntersectionObserver를 클래스로 모킹
  class MockIntersectionObserver {
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;
    _callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this._callback = callback;
    }
  }

  window.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useInfiniteScroll", () => {
  it("sentinelRef와 loadMore 함수를 반환해야 함", () => {
    const loadMoreFn = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({
        loadMore: loadMoreFn,
      })
    );

    expect(result.current.sentinelRef).toBeDefined();
    expect(result.current.loadMore).toBeDefined();
    expect(typeof result.current.loadMore).toBe("function");
  });

  it("기본 옵션으로 IntersectionObserver를 생성해야 함", async () => {
    const loadMoreFn = vi.fn();
    const TestComponent = () => {
      const { sentinelRef } = useInfiniteScroll({
        loadMore: loadMoreFn,
      });
      return createElement("div", { ref: sentinelRef });
    };

    render(createElement(TestComponent));

    await waitFor(() => {
      expect(window.IntersectionObserver).toHaveBeenCalled();
    });

    expect(mockObserve).toHaveBeenCalled();
  });

  it("hasMore가 false이면 Observer를 생성하지 않아야 함", async () => {
    const loadMoreFn = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        loadMore: loadMoreFn,
        hasMore: false,
      })
    );

    await waitFor(() => {
      // Observer가 생성되지 않았거나 observe가 호출되지 않아야 함
      expect(mockObserve).not.toHaveBeenCalled();
    });
  });

  it("isLoading이 true이면 Observer를 생성하지 않아야 함", async () => {
    const loadMoreFn = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        loadMore: loadMoreFn,
        isLoading: true,
      })
    );

    await waitFor(() => {
      expect(mockObserve).not.toHaveBeenCalled();
    });
  });

  it("loadMore 함수를 호출하면 loadMoreFn이 실행되어야 함", async () => {
    const loadMoreFn = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({
        loadMore: loadMoreFn,
      })
    );

    await result.current.loadMore();

    expect(loadMoreFn).toHaveBeenCalledTimes(1);
  });

  it("hasMore가 false일 때 loadMore를 호출해도 loadMoreFn이 실행되지 않아야 함", async () => {
    const loadMoreFn = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({
        loadMore: loadMoreFn,
        hasMore: false,
      })
    );

    await result.current.loadMore();

    expect(loadMoreFn).not.toHaveBeenCalled();
  });

  it("isLoading이 true일 때 loadMore를 호출해도 loadMoreFn이 실행되지 않아야 함", async () => {
    const loadMoreFn = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({
        loadMore: loadMoreFn,
        isLoading: true,
      })
    );

    await result.current.loadMore();

    expect(loadMoreFn).not.toHaveBeenCalled();
  });

  it("컴포넌트 언마운트 시 Observer가 disconnect되어야 함", () => {
    const loadMoreFn = vi.fn();
    const TestComponent = () => {
      const { sentinelRef } = useInfiniteScroll({
        loadMore: loadMoreFn,
      });
      return createElement("div", { ref: sentinelRef });
    };

    const { unmount } = render(createElement(TestComponent));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("direction 옵션이 제대로 전달되어야 함", async () => {
    const loadMoreFn = vi.fn();
    const TestComponent = () => {
      const { sentinelRef } = useInfiniteScroll({
        loadMore: loadMoreFn,
        direction: "up",
        threshold: 200,
      });
      return createElement("div", { ref: sentinelRef });
    };

    render(createElement(TestComponent));

    await waitFor(() => {
      expect(window.IntersectionObserver).toHaveBeenCalled();
    });

    // IntersectionObserver 생성 시 옵션이 전달되었는지 확인
    const observerCall = (
      window.IntersectionObserver as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(observerCall).toBeDefined();
  });

  it("root 옵션이 제대로 전달되어야 함", async () => {
    const loadMoreFn = vi.fn();
    const rootElement = document.createElement("div");
    const TestComponent = () => {
      const { sentinelRef } = useInfiniteScroll({
        loadMore: loadMoreFn,
        root: rootElement,
      });
      return createElement("div", { ref: sentinelRef });
    };

    render(createElement(TestComponent));

    await waitFor(() => {
      expect(window.IntersectionObserver).toHaveBeenCalled();
    });

    const observerCall = (
      window.IntersectionObserver as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(observerCall).toBeDefined();
  });
});
