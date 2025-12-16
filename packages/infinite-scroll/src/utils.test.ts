import { describe, it, expect, vi } from "vitest";
import {
  calculateRootMargin,
  createObserverOptions,
  createIntersectionCallback,
  canSetupObserver,
} from "./utils";

describe("utils", () => {
  describe("calculateRootMargin", () => {
    it("하단 스크롤일 때 하단에 threshold를 적용해야 함", () => {
      const result = calculateRootMargin("down", 100, "0px");
      expect(result).toBe("0px 0px 100px 0px");
    });

    it("상단 스크롤일 때 상단에 threshold를 적용해야 함", () => {
      const result = calculateRootMargin("up", 100, "0px");
      expect(result).toBe("100px 0px 0px 0px");
    });

    it("기본 rootMargin을 포함해야 함", () => {
      const result = calculateRootMargin("down", 100, "10px");
      expect(result).toBe("0px 10px 100px 10px");
    });

    it("상단 스크롤에서 기본 rootMargin을 포함해야 함", () => {
      const result = calculateRootMargin("up", 200, "20px");
      expect(result).toBe("200px 20px 0px 20px");
    });
  });

  describe("createObserverOptions", () => {
    it("root가 null이면 root를 null로 설정해야 함", () => {
      const options = createObserverOptions(null, "0px");
      expect(options.root).toBeNull();
      expect(options.rootMargin).toBe("0px");
      expect(options.threshold).toBe(0);
    });

    it("root가 HTMLElement면 root를 설정해야 함", () => {
      const root = document.createElement("div");
      const options = createObserverOptions(root, "100px");
      expect(options.root).toBe(root);
      expect(options.rootMargin).toBe("100px");
      expect(options.threshold).toBe(0);
    });

    it("rootMargin을 올바르게 설정해야 함", () => {
      const options = createObserverOptions(null, "50px 20px");
      expect(options.rootMargin).toBe("50px 20px");
    });
  });

  describe("createIntersectionCallback", () => {
    it("entry가 intersecting일 때 loadMore를 호출해야 함", () => {
      const loadMore = vi.fn();
      const callback = createIntersectionCallback(loadMore);

      const entry = {
        isIntersecting: true,
      } as IntersectionObserverEntry;

      callback([entry]);

      expect(loadMore).toHaveBeenCalledTimes(1);
    });

    it("entry가 intersecting이 아니면 loadMore를 호출하지 않아야 함", () => {
      const loadMore = vi.fn();
      const callback = createIntersectionCallback(loadMore);

      const entry = {
        isIntersecting: false,
      } as IntersectionObserverEntry;

      callback([entry]);

      expect(loadMore).not.toHaveBeenCalled();
    });

    it("Promise를 반환하는 loadMore도 처리해야 함", async () => {
      const loadMore = vi.fn().mockResolvedValue(undefined);
      const callback = createIntersectionCallback(loadMore);

      const entry = {
        isIntersecting: true,
      } as IntersectionObserverEntry;

      callback([entry]);

      expect(loadMore).toHaveBeenCalledTimes(1);
    });
  });

  describe("canSetupObserver", () => {
    it("hasMore가 true이고 isLoading이 false이고 sentinel이 있으면 true를 반환해야 함", () => {
      const sentinel = document.createElement("div");
      const result = canSetupObserver(true, false, sentinel);
      expect(result).toBe(true);
    });

    it("hasMore가 false이면 false를 반환해야 함", () => {
      const sentinel = document.createElement("div");
      const result = canSetupObserver(false, false, sentinel);
      expect(result).toBe(false);
    });

    it("isLoading이 true이면 false를 반환해야 함", () => {
      const sentinel = document.createElement("div");
      const result = canSetupObserver(true, true, sentinel);
      expect(result).toBe(false);
    });

    it("sentinel이 null이면 false를 반환해야 함", () => {
      const result = canSetupObserver(true, false, null);
      expect(result).toBe(false);
    });

    it("Type Guard로 작동해야 함", () => {
      const sentinel = document.createElement("div");
      if (canSetupObserver(true, false, sentinel)) {
        // TypeScript가 sentinel이 HTMLElement임을 인식해야 함
        expect(sentinel.tagName).toBe("DIV");
      }
    });
  });
});
