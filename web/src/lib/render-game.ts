import { obstaclesFor, CLOSE_CALL_FLASH, type GameState, type Point } from "./game";
import { DEFAULT_APPEARANCE, type FruitSkin } from "./appearance";
import { drawFruit } from "./fruit-art";
import type { Theme } from "./theme";

const PALETTES = {
  dark: { ground: "#143f3e", edge: "#081f25", grid: "#32615d", border: "#34766d", frond: "#1b4c46", frondAlt: "#286458", stone: "#497773", stoneTop: "#709b89", moss: "#2c5b4d", rush: "#59ead1", dash: "#ffe0a0", burst: "#8afbe5", playerLabel: "#ffe1a0", hunterLabel: "#f0c28c" },
  light: { ground: "#edf4e5", edge: "#d5e5d8", grid: "#8fac9d", border: "#527a69", frond: "#82b09a", frondAlt: "#5d947c", stone: "#52776a", stoneTop: "#a1baa0", moss: "#315b4c", rush: "#007b69", dash: "#a7620a", burst: "#00806b", playerLabel: "#764300", hunterLabel: "#6c4324" },
};

export const CANVAS_SIZE = 600;

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, -size * 0.8, size, 0);
  ctx.quadraticCurveTo(0, size * 0.8, -size, 0); ctx.fill(); ctx.restore();
}

const ghostLayers=new Map<string,HTMLCanvasElement>();
function ghostFruit(ctx:CanvasRenderingContext2D,skin:FruitSkin,x:number,y:number,size:number,theme:Theme) {
  const key=skin+theme;
  let layer=ghostLayers.get(key);
  if(!layer) {layer=document.createElement("canvas");layer.width=72;layer.height=72;drawFruit(layer.getContext("2d")!,skin,36,38,48,theme);ghostLayers.set(key,layer);}
  ctx.save();ctx.globalAlpha=.32;ctx.drawImage(layer,x-size*.75,y-size*.79,size*1.5,size*1.5);ctx.restore();
}

/** Effects represent the rules state; they never alter hitboxes or clocks. */
export function renderGame(ctx: CanvasRenderingContext2D, game: GameState, reduceMotion = false, ghost?: Point | null, theme: Theme = "light", viewport={width:CANVAS_SIZE,height:CANVAS_SIZE}, ghostSkin?:FruitSkin) {
  ctx.save();
  const palette = PALETTES[theme];
  const {width,height}=viewport, board=game.board??{columns:20,rows:20}, appearance=game.appearance??{fruit:"mango",snake:"amber"};
  const PAD=1, cellX=(width-PAD*2)/board.columns,cellY=(height-PAD*2)/board.rows,CELL=Math.min(cellX,cellY);
  const center=(p:Point)=>({x:PAD+(p.x+.5)*cellX,y:PAD+(p.y+.5)*cellY});
  ctx.clearRect(0, 0, width, height);
  const ground = ctx.createRadialGradient(width/2, height*.4, 30, width/2, height/2, Math.max(width,height)*.7);
  ground.addColorStop(0, palette.ground); ground.addColorStop(1, palette.edge);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, width, height);
  // Quiet dots replace the checkerboard lawn, keeping cell positions readable.
  ctx.fillStyle = palette.grid;
  for (let x = 0; x <= board.columns; x++) for (let y = 0; y <= board.rows; y++) {
    ctx.beginPath(); ctx.arc(PAD + x * cellX, PAD + y * cellY, 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = palette.border; ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, width - PAD * 2, height - PAD * 2);
  (game.displayObstacles ?? obstaclesFor(game.arena,board)).forEach(point => {
    const { x, y } = center(point);
    ctx.fillStyle = palette.stone;
    ctx.beginPath(); ctx.roundRect(x - CELL*.4, y - CELL*.4, CELL*.8, CELL*.8, 4); ctx.fill();
    ctx.fillStyle = palette.stoneTop;
    ctx.beginPath(); ctx.roundRect(x - CELL*.3, y - CELL*.3, CELL*.55, CELL*.15, 2); ctx.fill();
    leaf(ctx, x + 3, y + 4, 8, -0.45, palette.moss);
  });
  for (const power of game.displayPowerUps ?? []) {
    const p = center(power.position), radius = CELL * 0.4;
    ctx.fillStyle = power.kind === "speed" ? "#f7b43d" : "#79d8ef";
    ctx.strokeStyle = power.kind === "speed" ? "#79510d" : "#215d73";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(CELL / 24, CELL / 24);
    ctx.strokeStyle = "#173e36"; ctx.fillStyle = "#173e36"; ctx.lineWidth = 2;
    if (power.kind === "speed") {
      ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 8); ctx.lineTo(6, -2); ctx.lineTo(1, -2); ctx.closePath(); ctx.fill();
    } else {
      for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); }
    }
    ctx.restore();
  }
  if (!reduceMotion && game.boostRemaining > 0) {
    game.boostTrail.forEach((point, i) => {
      const p = center(point); ctx.globalAlpha = (i + 1) / (game.boostTrail.length + 2) * 0.55;
      leaf(ctx, p.x, p.y, 9, i * 0.7, palette.rush);
    }); ctx.globalAlpha = 1;
  }
  if (!reduceMotion && game.dashFlash > 0) {
    ctx.globalAlpha = game.dashFlash / 500;
    game.trail.forEach(point => { const p = center(point); leaf(ctx, p.x, p.y, 10, -0.6, palette.dash); }); ctx.globalAlpha = 1;
  }
  if(ghost) {const p=center(ghost);ghostFruit(ctx,ghostSkin??appearance.fruit,p.x,p.y,CELL*.94,theme);}
  const designs={amber:{edge:"#6c4324",fill:"#dc9845",head:"#f0b35b",mark:"#805031"},jade:{edge:"#164d45",fill:"#3caa8b",head:"#64c9a4",mark:"#216b57"},coral:{edge:"#793c50",fill:"#e66e78",head:"#ff9aa2",mark:"#85384b"},midnight:{edge:"#2d376d",fill:"#758ad4",head:"#a5b7f1",mark:"#d7d9ff"}};
  const design=designs[appearance.snake??DEFAULT_APPEARANCE.snake];
  const body = [...game.snake].reverse();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const bodyPath = () => {
    ctx.beginPath();
    body.forEach((segment, i) => { const p = center(segment); if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  };
  ctx.strokeStyle = design.edge; ctx.lineWidth = CELL*.92; bodyPath(); ctx.stroke();
  ctx.strokeStyle = design.fill; ctx.lineWidth = CELL*.72; bodyPath(); ctx.stroke();
  body.forEach((segment, i) => {
    const p=center(segment);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=design.mark;ctx.strokeStyle=design.mark;
    if(appearance.snake==="jade"){ctx.fillRect(-CELL*.08,-CELL*.34,CELL*.16,CELL*.68);}
    else if(appearance.snake==="coral"){ctx.beginPath();ctx.arc(i%2?CELL*.12:-CELL*.12,0,CELL*.13,0,Math.PI*2);ctx.fill();}
    else if(appearance.snake==="midnight"){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-CELL*.22,-CELL*.1);ctx.lineTo(0,CELL*.12);ctx.lineTo(CELL*.22,-CELL*.1);ctx.stroke();}
    else{ctx.rotate(Math.PI/4);ctx.fillRect(-CELL*.14,-CELL*.14,CELL*.28,CELL*.28);}ctx.restore();
  });
  const head = center(game.snake[0]); ctx.save(); ctx.translate(head.x, head.y);
  ctx.scale(CELL/27.6,CELL/27.6);
  ctx.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[game.snakeDirection]);
  ctx.fillStyle = design.head; ctx.beginPath(); ctx.ellipse(1, 0, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
  if (theme === "light") { ctx.strokeStyle = "#6c4324"; ctx.lineWidth = 1.5; ctx.stroke(); }
  [-5.5, 5.5].forEach(y => {
    ctx.fillStyle = "#fff1cb"; ctx.beginPath(); ctx.ellipse(5, y, 3.3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#173b3c"; ctx.fillRect(5, y - 1.7, 1.5, 3.4);
  }); ctx.restore();
  if (game.boostRemaining > 0) {
    const p = center(game.player); ctx.strokeStyle = palette.rush; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.stroke();
  }
  const fruit=center(game.player);
  if (game.displayStunRemaining) {
    ctx.strokeStyle = "#287da0"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fruit.x, fruit.y, CELL * 0.53, 0, Math.PI * 2); ctx.stroke();
  }
  drawFruit(ctx,appearance.fruit,fruit.x,fruit.y,CELL*.94,theme);
  if (!reduceMotion && game.closeCallFlash > 0 && game.closeCallAt) {
    const p = center(game.closeCallAt); const progress = 1 - game.closeCallFlash / CLOSE_CALL_FLASH;
    ctx.globalAlpha = 1 - progress;
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4; const radius = 12 + progress * 32;
      leaf(ctx, p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius, 5, angle + progress, palette.burst);
    } ctx.globalAlpha = 1;
  }
  if (game.phase === "ready") {
    ctx.font = "600 12px 'DM Sans Variable', sans-serif"; ctx.fillStyle = palette.playerLabel;
    const p = center(game.player); ctx.fillText("YOU", p.x - 12, p.y + 32);
    ctx.fillStyle = palette.hunterLabel; ctx.fillText("THE HUNTER", head.x - 40, head.y - 24);
  }
  ctx.restore();
}
