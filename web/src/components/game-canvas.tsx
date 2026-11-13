"use client";

import { useEffect, type RefObject } from "react";
import type { GameState } from "@/lib/game";
import { CANVAS_SIZE, renderGame } from "@/lib/render-game";

export function GameCanvas({ gameRef, canvasRef, ghostRef, ariaLabel }: { gameRef: RefObject<GameState>; canvasRef: RefObject<HTMLCanvasElement | null>; ghostRef?: RefObject<GameState | null>; ariaLabel?: string }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.dataset.mounted = "true";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastState: GameState | null = null;
    let lastDpr = 0;
    let lastReduced = reduceMotion.matches;
    const draw = () => {
      const game = gameRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (dpr !== lastDpr) {
        canvas.width = CANVAS_SIZE * dpr; canvas.height = CANVAS_SIZE * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      if (game !== lastState || dpr !== lastDpr || reduceMotion.matches !== lastReduced) {
        renderGame(ctx, game, reduceMotion.matches, ghostRef?.current?.player);
        lastState = game; lastDpr = dpr; lastReduced = reduceMotion.matches;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); delete canvas.dataset.mounted; };
  }, [gameRef, canvasRef, ghostRef]);

  return <canvas ref={canvasRef} className="game-canvas" tabIndex={0} role="application" aria-label={ariaLabel ?? "Reverse Snake playing field. Hold arrow keys or WASD to move the mango, Space to dash, Escape to pause."} />;
}
