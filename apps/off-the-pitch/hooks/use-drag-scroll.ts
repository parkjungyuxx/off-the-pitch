import { useRef, useEffect, useState, useCallback } from "react";

export function useDragScroll<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const scrollRef = useCallback((element: T | null) => {
    setNode(element);
  }, []);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const element = node;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.pageX - element.offsetLeft;
      scrollLeft.current = element.scrollLeft;
      element.style.cursor = "grabbing";
      element.style.userSelect = "none";
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      element.style.cursor = "grab";
      element.style.userSelect = "";
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      element.style.cursor = "grab";
      element.style.userSelect = "";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX.current) * 2; // 스크롤 속도 조절
      element.scrollLeft = scrollLeft.current - walk;
    };

    element.style.cursor = "grab";
    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("mousemove", handleMouseMove);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mousemove", handleMouseMove);
    };
  }, [node]);

  return scrollRef;
}

