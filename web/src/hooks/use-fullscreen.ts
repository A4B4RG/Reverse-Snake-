"use client";
import { useCallback, useEffect, useState, type RefObject } from "react";

let transitions = 0;
export const fullscreenTransition = () => transitions > 0;

export function useFullscreen(frame: RefObject<HTMLElement | null>, canvas: RefObject<HTMLCanvasElement | null>, notice: (text: string) => void) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const changed = () => {
      setIsFullscreen(document.fullscreenElement === frame.current);
      if (!document.hidden) canvas.current?.focus({ preventScroll: true });
    };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, [frame, canvas]);
  const toggleFullscreen = useCallback(async () => {
    if (fullscreenTransition()) return;
    transitions++;
    notice("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen();
      else notice("Fullscreen is not supported in this browser.");
    } catch { notice("Fullscreen is unavailable in this browser window."); }
    finally {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!document.hidden) canvas.current?.focus({ preventScroll: true });
      transitions--;
    }
  }, [frame, canvas, notice]);
  return { isFullscreen, toggleFullscreen };
}
