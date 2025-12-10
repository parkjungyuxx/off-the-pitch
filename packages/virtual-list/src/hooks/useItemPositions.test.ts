import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useItemPositions } from "./useItemPositions";

describe("useItemPositions", () => {
  it("고정 높이로 아이템 위치를 계산해야 함", () => {
    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 5,
        itemHeight: 100,
        itemHeights: [],
        measureItemHeight: false,
        itemSpacing: 0,
      })
    );

    expect(result.current.itemPositions).toEqual([0, 100, 200, 300, 400]);
    expect(result.current.totalHeight).toBe(500);
  });

  it("itemSpacing을 고려하여 위치를 계산해야 함", () => {
    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 3,
        itemHeight: 100,
        itemHeights: [],
        measureItemHeight: false,
        itemSpacing: 10,
      })
    );

    // itemSpacing은 measureItemHeight가 활성화된 경우에만 적용됨
    expect(result.current.itemPositions).toEqual([0, 100, 200]);
    expect(result.current.totalHeight).toBe(300);
  });

  it("동적 높이 함수를 처리해야 함", () => {
    const getItemHeight = (index: number) => 50 + index * 10;

    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 4,
        itemHeight: getItemHeight,
        itemHeights: [],
        measureItemHeight: false,
        itemSpacing: 0,
      })
    );

    expect(result.current.itemPositions).toEqual([0, 50, 110, 180]);
    expect(result.current.totalHeight).toBe(260); // 50 + 60 + 70 + 80
  });

  it("measureItemHeight가 활성화되고 측정된 높이가 있으면 사용해야 함", () => {
    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 3,
        itemHeight: 100,
        itemHeights: [150, 200, 180],
        measureItemHeight: true,
        itemSpacing: 10,
      })
    );

    // 측정된 높이 + itemSpacing 사용
    expect(result.current.itemPositions[0]).toBe(0);
    expect(result.current.itemPositions[1]).toBe(160); // 150 + 10
    expect(result.current.itemPositions[2]).toBe(370); // 160 + (200 + 10)
    expect(result.current.totalHeight).toBe(560); // 370 + (180 + 10)
  });

  it("측정된 높이가 없으면 기본 높이를 사용해야 함", () => {
    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 3,
        itemHeight: 100,
        itemHeights: [150, undefined, 180],
        measureItemHeight: true,
        itemSpacing: 10,
      })
    );

    // 첫 번째는 측정된 높이 + itemSpacing 사용, 두 번째는 기본 높이 사용 (itemSpacing 없음)
    expect(result.current.itemPositions[0]).toBe(0);
    expect(result.current.itemPositions[1]).toBe(160); // 150 + 10
    expect(result.current.itemPositions[2]).toBe(260); // 160 + 100 (기본 높이, itemSpacing 없음)
    expect(result.current.totalHeight).toBe(450); // 260 + (180 + 10)
  });

  it("itemCount가 0이면 totalHeight가 0이어야 함", () => {
    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 0,
        itemHeight: 100,
        itemHeights: [],
        measureItemHeight: false,
        itemSpacing: 0,
      })
    );

    // itemPositions는 [0]으로 시작하지만 itemCount가 0이면 [0]만 있음
    // totalHeight는 0이어야 함
    expect(result.current.totalHeight).toBe(0);
  });

  it("getItemHeight 함수가 올바르게 작동해야 함", () => {
    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 3,
        itemHeight: 100,
        itemHeights: [],
        measureItemHeight: false,
        itemSpacing: 0,
      })
    );

    expect(result.current.getItemHeight(0)).toBe(100);
    expect(result.current.getItemHeight(1)).toBe(100);
    expect(result.current.getItemHeight(2)).toBe(100);
  });

  it("동적 높이 함수와 getItemHeight가 일치해야 함", () => {
    const getItemHeight = (index: number) => 50 + index * 10;

    const { result } = renderHook(() =>
      useItemPositions({
        itemCount: 3,
        itemHeight: getItemHeight,
        itemHeights: [],
        measureItemHeight: false,
        itemSpacing: 0,
      })
    );

    expect(result.current.getItemHeight(0)).toBe(50);
    expect(result.current.getItemHeight(1)).toBe(60);
    expect(result.current.getItemHeight(2)).toBe(70);
  });
});
