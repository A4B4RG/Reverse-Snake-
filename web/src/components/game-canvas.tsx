"use client";

import { useEffect, type RefObject } from "react";
import { ARENAS, GRID, type GameState, type Point } from "@/lib/game";

const SIZE = 600;
const PAD = 20;
const CELL = (SIZE - PAD * 2) / GRID;
const center = (point: Point) => ({ x: PAD + (point.x + 0.5) * CELL, y: PAD + (point.y + 0.5) * CELL });

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

function drawApple(ctx: CanvasRenderingContext2D, point: Point, pulse: number, dash: boolean) {
  const { x, y } = center(point);
  ctx.save();
  ctx.shadowColor = dash ? "#f5fac0" : "#ff8069";
  ctx.shadowBlur = dash ? 24 : 12 + pulse * 4;
  rounded(ctx, x - 10, y - 8, 20, 19, 6, dash ? "#f8f6ca" : "#ff8069");
  ctx.shadowBlur = 0;
  rounded(ctx, x - 1, y - 15, 3, 7, 1, "#e8eace");
  ctx.fillStyle = "#d4f48c";
  ctx.beginPath(); ctx.ellipse(x + 5, y - 13, 5, 2.7, -0.5, 0, Math.PI * 2); ctx.fill();
  rounded(ctx, x - 6, y - 5, 3, 6, 1.5, "#ffb297");
  ctx.restore();
}

export function GameCanvas({ gameRef, canvasRef }: { gameRef: RefObject<GameState>; canvasRef: RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const draw = (now: number) => {
      const game = gameRef.current;
      const ready = game.phase === "ready";
      const pulse = reduceMotion.matches || game.phase !== "running" ? 0 : Math.sin(now / 300);
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = "rgba(160, 195, 140, 0.09)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(PAD + i * CELL, PAD); ctx.lineTo(PAD + i * CELL, SIZE - PAD); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(PAD, PAD + i * CELL); ctx.lineTo(SIZE - PAD, PAD + i * CELL); ctx.stroke();
      }
      // Small corner marks make the grid read as an arcade playing field.
      ctx.strokeStyle = "#607c59";
      [[PAD, PAD, 1, 1], [SIZE - PAD, PAD, -1, 1], [PAD, SIZE - PAD, 1, -1], [SIZE - PAD, SIZE - PAD, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(x, y + dy * 9); ctx.lineTo(x, y); ctx.lineTo(x + dx * 9, y); ctx.stroke();
      });
      ARENAS[game.arena].obstacles.forEach(point => {
        const { x, y } = center(point);
        rounded(ctx, x - CELL / 2 + 2, y - CELL / 2 + 2, CELL - 4, CELL - 4, 4, "#53704d");
        rounded(ctx, x - CELL / 2 + 5, y - CELL / 2 + 5, CELL - 10, 3, 1, "#708765");
      });
      if (game.dashFlash > 0) {
        ctx.globalAlpha = game.dashFlash / 400;
        game.trail.forEach(point => { const p = center(point); rounded(ctx, p.x - 8, p.y - 8, 16, 16, 5, "#f2f4aa"); });
        ctx.globalAlpha = 1;
      }
      // Continuous rounded body, with a subtle seam at each cell.
      const body = [...game.snake].reverse();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "#bad765"; ctx.lineWidth = CELL - 5;
      ctx.beginPath();
      body.forEach((segment, i) => { const p = center(segment); if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      body.forEach((segment, index) => {
        const p = center(segment);
        rounded(ctx, p.x - 9, p.y - 9, 18, 18, 4, index % 2 === 0 ? "#c3df72" : "#c9e578");
      });
      const head = center(game.snake[0]);
      rounded(ctx, head.x - 13, head.y - 13, 26, 26, 7, "#dcf58a");
      const eyePositions = {
        left: [[-5, -6], [-5, 6]], right: [[5, -6], [5, 6]],
        up: [[-6, -5], [6, -5]], down: [[-6, 5], [6, 5]],
      }[game.snakeDirection];
      eyePositions.forEach(([x, y]) => rounded(ctx, head.x + x - 2, head.y + y - 2, 4, 4, 1, "#19372a"));
      drawApple(ctx, game.player, pulse, game.dashFlash > 0);
      if (ready) {
        const apple = center(game.player);
        ctx.font = "600 10px 'DM Sans Variable', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillStyle = "#f9b1a0";
        ctx.fillText("YOU", apple.x - 10, apple.y + 35);
        ctx.fillStyle = "#b8cb96";
        ctx.fillText("THE HUNTER", head.x - 69, head.y - 28);
        ctx.letterSpacing = "0px";
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [gameRef, canvasRef]);

  return <canvas ref={canvasRef} className="game-canvas" tabIndex={0} role="application" aria-label="Reverse Snake playing field. Hold arrow keys or WASD to move the apple, Space to dash, Escape to pause." />;
}
