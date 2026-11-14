"use client";
import { useEffect, useRef, type RefObject } from "react";
import type { GameState } from "@/lib/game";
import { boardForSize, type Board } from "@/lib/board";
import { renderGame } from "@/lib/render-game";
import {
  ReplayCursor,
  readPreview,
  readReplays,
  type Replay,
} from "@/lib/replay";
import { displayRun } from "@/lib/run-display";
import { useTheme } from "@/lib/theme";

export function GameCanvas({
  gameRef,
  canvasRef,
  ghostRef,
  previewRef,
  onResize,
  ariaLabel,
}: {
  gameRef: RefObject<GameState>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ghostRef?: RefObject<GameState | null>;
  previewRef?: RefObject<Replay | null>;
  onResize?: (b: Board) => void;
  ariaLabel?: string;
}) {
  const theme = useTheme(),
    themeRef = useRef(theme),
    resizeRef = useRef(onResize);
  useEffect(() => {
    themeRef.current = theme;
    resizeRef.current = onResize;
  }, [theme, onResize]);
  useEffect(() => {
    const canvas = canvasRef.current,
      ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.dataset.mounted = "true";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1,
      height = 1,
      frame = 0,
      lastWidth = 0,
      lastHeight = 0,
      lastDpr = 0,
      lastState: GameState | null = null,
      lastGhost: GameState | null = null,
      lastTheme = "",
      lastReduced = false;
    let pauseCursor: ReplayCursor | null = null,
      source: Replay | null = null,
      paused = false,
      previous = 0,
      accumulator = 0;
    const measure = () => {
      const r = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(r.width));
      height = Math.max(1, Math.round(r.height));
      resizeRef.current?.(boardForSize(width, height));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    measure();
    const draw = (now: number) => {
      const live = gameRef.current,
        dpr = Math.min(window.devicePixelRatio || 1, 2),
        theme = themeRef.current;
      if (live.phase === "paused" && !paused) {
        source =
          previewRef?.current ?? readPreview() ?? readReplays()[0] ?? null;
        pauseCursor = source ? new ReplayCursor(source) : null;
        accumulator = 0;
      }
      if (live.phase !== "paused") pauseCursor = null;
      paused = live.phase === "paused";
      if (pauseCursor && !reduced.matches) {
        accumulator += previous ? Math.min(200, now - previous) : 0;
        while (accumulator >= 20) {
          if (pauseCursor.done) pauseCursor = new ReplayCursor(source!);
          pauseCursor.advance();
          accumulator -= 20;
        }
      }
      previous = now;
      const game = pauseCursor ? displayRun(pauseCursor.state) : live,
        ghost = paused ? null : ghostRef?.current;
      const resized =
        width !== lastWidth || height !== lastHeight || dpr !== lastDpr;
      if (resized) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const visualChanged =
        !lastState ||
        game.snake !== lastState.snake ||
        game.player !== lastState.player ||
        game.board !== lastState.board ||
        game.appearance !== lastState.appearance ||
        game.phase !== lastState.phase ||
        game.snakeDirection !== lastState.snakeDirection ||
        game.dashFlash !== lastState.dashFlash ||
        game.closeCallFlash !== lastState.closeCallFlash ||
        Boolean(game.boostRemaining) !== Boolean(lastState.boostRemaining) ||
        game.boostTrail !== lastState.boostTrail;
      if (
        resized ||
        visualChanged ||
        ghost !== lastGhost ||
        theme !== lastTheme ||
        reduced.matches !== lastReduced
      ) {
        renderGame(
          ctx,
          game,
          reduced.matches,
          ghost?.player,
          theme,
          { width, height },
          ghost?.appearance?.fruit,
        );
        canvas.dataset.theme = theme;
        canvas.dataset.columns = String(live.board.columns);
        canvas.dataset.rows = String(live.board.rows);
        canvas.dataset.elapsed = String(live.elapsed);
        canvas.dataset.previewElapsed = pauseCursor ? String(game.elapsed) : "";
        canvas.dataset.fruit = live.appearance.fruit;
        canvas.dataset.snake = live.appearance.snake;
        lastState = game;
        lastGhost = ghost ?? null;
        lastTheme = theme;
        lastReduced = reduced.matches;
        lastWidth = width;
        lastHeight = height;
        lastDpr = dpr;
      }
      canvas.dataset.elapsed = String(live.elapsed);
      canvas.dataset.previewElapsed = pauseCursor ? String(game.elapsed) : "";
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      delete canvas.dataset.mounted;
    };
  }, [gameRef, canvasRef, ghostRef, previewRef]);
  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      tabIndex={0}
      role="application"
      aria-label={
        ariaLabel ??
        "Reverse Snake playing field. Hold arrow keys or WASD to move the fruit, Space to dash, Escape to pause."
      }
    />
  );
}
