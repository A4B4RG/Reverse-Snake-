import type { FruitSkin } from "./appearance";
import type { Theme } from "./theme";

export const FRUIT_COLORS: Record<FruitSkin, string> = {
  apple: "#e65252",
  mango: "#ffc55e",
  pear: "#abd059",
  orange: "#fa982e",
  strawberry: "#e9476d",
};
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  skin: FruitSkin,
  x: number,
  y: number,
  size: number,
  theme: Theme,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 28, size / 28);
  ctx.fillStyle = FRUIT_COLORS[skin];
  ctx.strokeStyle = theme === "light" ? "#653d2b" : "#132e2a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (skin === "mango") {
    ctx.ellipse(0, 1, 9, 12, -0.45, 0, Math.PI * 2);
  } else if (skin === "orange") {
    ctx.arc(0, 2, 11, 0, Math.PI * 2);
  } else if (skin === "pear") {
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(9, -10, 4, -2, 10, 3);
    ctx.bezierCurveTo(18, 17, -18, 17, -10, 3);
    ctx.bezierCurveTo(-4, -2, -9, -10, 0, -10);
  } else if (skin === "strawberry") {
    ctx.moveTo(0, -9);
    ctx.bezierCurveTo(22, -14, 11, 9, 0, 15);
    ctx.bezierCurveTo(-11, 9, -22, -14, 0, -9);
  } else {
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(16, -15, 17, 10, 5, 13);
    ctx.quadraticCurveTo(0, 10, -5, 13);
    ctx.bezierCurveTo(-17, 10, -16, -15, 0, -6);
  }
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#fff2c7";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(-8, 2, -5, 6);
  ctx.stroke();
  if (skin === "strawberry") {
    ctx.fillStyle = "#ffe4a3";
    for (const [a, b] of [
      [-6, -1],
      [3, 0],
      [-3, 5],
      [3, 8],
    ]) {
      ctx.beginPath();
      ctx.ellipse(a, b, 0.8, 1.3, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (skin === "orange") {
    ctx.fillStyle = "#cb6b18";
    for (const [a, b] of [
      [3, 5],
      [7, 1],
      [0, 8],
    ]) {
      ctx.beginPath();
      ctx.arc(a, b, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = "#745134";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(1, -15);
  ctx.stroke();
  ctx.fillStyle = theme === "dark" ? "#63ceb4" : "#287b60";
  ctx.beginPath();
  ctx.moveTo(1, -11);
  ctx.quadraticCurveTo(3, -20, 12, -15);
  ctx.quadraticCurveTo(8, -8, 1, -11);
  ctx.fill();
  if (skin === "strawberry") {
    ctx.beginPath();
    ctx.moveTo(-10, -7);
    ctx.lineTo(-4, -12);
    ctx.lineTo(0, -8);
    ctx.lineTo(5, -12);
    ctx.lineTo(10, -7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
