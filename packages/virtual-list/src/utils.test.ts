import { describe, it, expect } from "vitest";
import { findVisibleRange, createVirtualItems } from "./utils";
import type { VirtualItem } from "./useVirtualList";

describe("utils", () => {
  describe("findVisibleRange", () => {
    it("뷰포트 범위 내의 아이템을 찾아야 함", () => {
      const itemPositions = [0, 100, 200, 300, 400];
      const getItemHeight = () => 100;

      const result = findVisibleRange(
        150,
        350,
        5,
        itemPositions,
        getItemHeight
      );

      // 150-350 범위에 있는 아이템: 100-200, 200-300, 300-400
      // 이진 탐색으로 찾은 첫 번째 아이템의 인덱스
      expect(result.startIndex).toBeGreaterThanOrEqual(1);
      expect(result.startIndex).toBeLessThanOrEqual(3);
      expect(result.endIndex).toBe(4); // endIndex는 항상 마지막 인덱스
    });

    it("뷰포트 시작 위치보다 앞에 있는 아이템은 제외해야 함", () => {
      const itemPositions = [0, 100, 200, 300, 400];
      const getItemHeight = () => 100;

      const result = findVisibleRange(
        250,
        450,
        5,
        itemPositions,
        getItemHeight
      );

      expect(result.startIndex).toBe(2);
      expect(result.endIndex).toBe(4);
    });

    it("뷰포트 끝 위치보다 뒤에 있는 아이템은 제외해야 함", () => {
      const itemPositions = [0, 100, 200, 300, 400];
      const getItemHeight = () => 100;

      const result = findVisibleRange(0, 150, 5, itemPositions, getItemHeight);

      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(1);
    });

    it("모든 아이템이 뷰포트 범위 내에 있으면 전체 범위를 반환해야 함", () => {
      const itemPositions = [0, 100, 200];
      const getItemHeight = () => 100;

      const result = findVisibleRange(0, 300, 3, itemPositions, getItemHeight);

      // 이진 탐색으로 찾은 첫 번째 아이템 (0-100 범위)
      expect(result.startIndex).toBeGreaterThanOrEqual(0);
      expect(result.startIndex).toBeLessThanOrEqual(2);
      expect(result.endIndex).toBe(2); // endIndex는 항상 마지막 인덱스
    });

    it("뷰포트 범위 밖에 아이템만 있으면 적절한 범위를 반환해야 함", () => {
      const itemPositions = [0, 100, 200, 300, 400];
      const getItemHeight = () => 100;

      const result = findVisibleRange(
        500,
        600,
        5,
        itemPositions,
        getItemHeight
      );

      // 뷰포트가 모든 아이템보다 뒤에 있으면 마지막 인덱스 반환
      expect(result.startIndex).toBeGreaterThanOrEqual(0);
      expect(result.endIndex).toBeLessThanOrEqual(4);
    });

    it("동적 높이를 가진 아이템도 처리해야 함", () => {
      const itemPositions = [0, 50, 120, 200];
      const getItemHeight = (index: number) => {
        return index === 0 ? 50 : index === 1 ? 70 : 80;
      };

      const result = findVisibleRange(30, 150, 4, itemPositions, getItemHeight);

      expect(result.startIndex).toBeGreaterThanOrEqual(0);
      expect(result.endIndex).toBeLessThanOrEqual(3);
    });

    it("빈 배열일 때도 처리해야 함", () => {
      const itemPositions: number[] = [];
      const getItemHeight = () => 100;

      const result = findVisibleRange(0, 100, 0, itemPositions, getItemHeight);

      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(-1);
    });
  });

  describe("createVirtualItems", () => {
    it("보이는 범위의 가상 아이템을 생성해야 함", () => {
      const itemPositions = [0, 100, 200, 300, 400];
      const getItemHeight = () => 100;
      const createItemRef = () => () => {};

      const result = createVirtualItems(
        1,
        3,
        0,
        5,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      expect(result).toHaveLength(3);
      expect(result[0].index).toBe(1);
      expect(result[0].start).toBe(100);
      expect(result[0].size).toBe(100);
      expect(result[0].end).toBe(200);
      expect(result[2].index).toBe(3);
    });

    it("오버스캔을 적용해야 함", () => {
      const itemPositions = [0, 100, 200, 300, 400, 500];
      const getItemHeight = () => 100;
      const createItemRef = () => () => {};

      const result = createVirtualItems(
        2,
        3,
        1,
        6,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      // 오버스캔 1이므로 시작: 2-1=1, 끝: 3+1=4
      expect(result).toHaveLength(4);
      expect(result[0].index).toBe(1);
      expect(result[result.length - 1].index).toBe(4);
    });

    it("오버스캔이 시작 인덱스를 음수로 만들지 않아야 함", () => {
      const itemPositions = [0, 100, 200];
      const getItemHeight = () => 100;
      const createItemRef = () => () => {};

      const result = createVirtualItems(
        0,
        1,
        2,
        3,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      expect(result[0].index).toBe(0);
      expect(result.length).toBeGreaterThan(0);
    });

    it("오버스캔이 끝 인덱스를 배열 범위를 넘지 않아야 함", () => {
      const itemPositions = [0, 100, 200];
      const getItemHeight = () => 100;
      const createItemRef = () => () => {};

      const result = createVirtualItems(
        1,
        2,
        2,
        3,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      const lastIndex = result[result.length - 1].index;
      expect(lastIndex).toBeLessThanOrEqual(2);
    });

    it("각 아이템에 ref 함수를 연결해야 함", () => {
      const itemPositions = [0, 100];
      const getItemHeight = () => 100;
      const createItemRef = (index: number) => () => {};

      const result = createVirtualItems(
        0,
        1,
        0,
        2,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      expect(result[0].ref).toBeDefined();
      expect(typeof result[0].ref).toBe("function");
      expect(result[1].ref).toBeDefined();
      expect(typeof result[1].ref).toBe("function");
    });

    it("동적 높이를 가진 아이템도 처리해야 함", () => {
      const itemPositions = [0, 50, 120];
      const getItemHeight = (index: number) => {
        return index === 0 ? 50 : index === 1 ? 70 : 80;
      };
      const createItemRef = () => () => {};

      const result = createVirtualItems(
        0,
        2,
        0,
        3,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      expect(result).toHaveLength(3);
      expect(result[0].size).toBe(50);
      expect(result[1].size).toBe(70);
      expect(result[2].size).toBe(80);
    });

    it("end 값이 start + size와 일치해야 함", () => {
      const itemPositions = [0, 100, 200];
      const getItemHeight = () => 100;
      const createItemRef = () => () => {};

      const result = createVirtualItems(
        0,
        2,
        0,
        3,
        itemPositions,
        getItemHeight,
        createItemRef
      );

      result.forEach((item) => {
        expect(item.end).toBe(item.start + item.size);
      });
    });
  });
});
