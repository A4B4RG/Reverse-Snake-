import { ARENAS, CLOSE_CALL_FLASH, GRID, type GameState, type Point } from "./game";

export const CANVAS_SIZE = 600;
const PAD = 24;
const CELL = (CANVAS_SIZE - PAD * 2) / GRID;
const center = (point: Point) => ({ x: PAD + (point.x + 0.5) * CELL, y: PAD + (point.y + 0.5) * CELL });

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, -size * 0.8, size, 0);
  ctx.quadraticCurveTo(0, size * 0.8, -size, 0); ctx.fill(); ctx.restore();
}

function mango(ctx: CanvasRenderingContext2D, point: Point, boosted: boolean) {
  const { x, y } = center(point);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.45);
  ctx.shadowColor = boosted ? "#59ead1" : "#ffca6a"; ctx.shadowBlur = boosted ? 17 : 7;
  ctx.fillStyle = "#ffc55e";
  ctx.beginPath(); ctx.ellipse(0, 1, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffe9ac"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(-1, 0, 5, 8, 0, Math.PI, Math.PI * 1.6); ctx.stroke();
  ctx.strokeStyle = "#ce9a53"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(1, -16); ctx.stroke();
  leaf(ctx, 6, -13, 6, -0.35, "#63ceb4"); ctx.restore();
}

/** Effects represent the rules state; they never alter hitboxes or clocks. */
export function renderGame(ctx: CanvasRenderingContext2D, game: GameState, reduceMotion = false) {
  const size = CANVAS_SIZE;
  ctx.clearRect(0, 0, size, size);
  const ground = ctx.createRadialGradient(300, 260, 30, 300, 300, 400);
  ground.addColorStop(0, "#143f3e"); ground.addColorStop(1, "#081f25");
  ctx.fillStyle = ground; ctx.fillRect(0, 0, size, size);
  // Quiet dots replace the checkerboard lawn, keeping cell positions readable.
  ctx.fillStyle = "#32615d";
  for (let x = 0; x <= GRID; x++) for (let y = 0; y <= GRID; y++) {
    ctx.beginPath(); ctx.arc(PAD + x * CELL, PAD + y * CELL, 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = "#34766d"; ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, size - PAD * 2, size - PAD * 2);
  // Fronds stay outside playable cells and never hide the hunter.
  for (let i = 0; i < 14; i++) {
    const n = 12 + i * 44;
    leaf(ctx, n, 10, 15, -0.5, i % 2 ? "#1b4c46" : "#286458");
    leaf(ctx, size - 10, n, 14, 0.8, "#1b4c46");
    leaf(ctx, n, size - 10, 13, 0.5, "#1b4c46");
    leaf(ctx, 10, n, 15, -0.8, "#286458");
  }
  ARENAS[game.arena].obstacles.forEach(point => {
    const { x, y } = center(point);
    ctx.fillStyle = "#497773";
    ctx.beginPath(); ctx.roundRect(x - 11, y - 11, 22, 22, 6); ctx.fill();
    ctx.fillStyle = "#709b89";
    ctx.beginPath(); ctx.roundRect(x - 8, y - 8, 15, 4, 2); ctx.fill();
    leaf(ctx, x + 3, y + 4, 8, -0.45, "#2c5b4d");
  });
  if (!reduceMotion && game.boostRemaining > 0) {
    game.boostTrail.forEach((point, i) => {
      const p = center(point); ctx.globalAlpha = (i + 1) / (game.boostTrail.length + 2) * 0.55;
      leaf(ctx, p.x, p.y, 9, i * 0.7, "#59ead1");
    }); ctx.globalAlpha = 1;
  }
  if (!reduceMotion && game.dashFlash > 0) {
    ctx.globalAlpha = game.dashFlash / 500;
    game.trail.forEach(point => { const p = center(point); leaf(ctx, p.x, p.y, 10, -0.6, "#ffe0a0"); }); ctx.globalAlpha = 1;
  }
  const body = [...game.snake].reverse();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const bodyPath = () => {
    ctx.beginPath();
    body.forEach((segment, i) => { const p = center(segment); if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  };
  ctx.strokeStyle = "#6c4324"; ctx.lineWidth = CELL - 2; bodyPath(); ctx.stroke();
  ctx.strokeStyle = "#dc9845"; ctx.lineWidth = CELL - 7; bodyPath(); ctx.stroke();
  body.forEach((segment, i) => {
    const p = center(segment); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = i % 2 ? "#995d31" : "#805031"; ctx.fillRect(-4, -4, 8, 8); ctx.restore();
  });
  const head = center(game.snake[0]); ctx.save(); ctx.translate(head.x, head.y);
  ctx.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[game.snakeDirection]);
  ctx.fillStyle = "#f0b35b"; ctx.beginPath(); ctx.ellipse(1, 0, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
  [-5.5, 5.5].forEach(y => {
    ctx.fillStyle = "#fff1cb"; ctx.beginPath(); ctx.ellipse(5, y, 3.3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#173b3c"; ctx.fillRect(5, y - 1.7, 1.5, 3.4);
  }); ctx.restore();
  if (game.boostRemaining > 0) {
    const p = center(game.player); ctx.strokeStyle = "#59ead1"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.stroke();
  }
  mango(ctx, game.player, game.boostRemaining > 0);
  if (!reduceMotion && game.closeCallFlash > 0 && game.closeCallAt) {
    const p = center(game.closeCallAt); const progress = 1 - game.closeCallFlash / CLOSE_CALL_FLASH;
    ctx.globalAlpha = 1 - progress;
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4; const radius = 12 + progress * 32;
      leaf(ctx, p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius, 5, angle + progress, "#8afbe5");
    } ctx.globalAlpha = 1;
  }
  if (game.phase === "ready") {
    ctx.font = "600 12px 'DM Sans Variable', sans-serif"; ctx.fillStyle = "#ffe1a0";
    const p = center(game.player); ctx.fillText("YOU", p.x - 12, p.y + 32);
    ctx.fillStyle = "#f0c28c"; ctx.fillText("THE HUNTER", head.x - 40, head.y - 24);
  }
}
