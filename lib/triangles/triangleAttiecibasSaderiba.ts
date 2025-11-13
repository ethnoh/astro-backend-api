// lib/triangleAttiecibasSaderiba.ts
import { createCanvas, CanvasRenderingContext2D } from "canvas";

// === COLORS (в тон звезде SaderibaSum) ===
const EDGE = "rgba(255,255,255,0.5)";
const ACCENT_FILL = "#800000";        // тёмно-бордовый
const ACCENT_STROKE = "#ff4c4c";      // контур
const TXT_COLOR = "#fff";

// === Размер уменьшенный ×2.5 ===
const W = 240;
const H = 200;

// === Helper: reduce to <= 22 ===
function reduce22(num: number): number {
  while (num > 22) {
    num = num.toString().split("").reduce((a, b) => a + parseInt(b), 0);
  }
  return num;
}

// === Core math for Attiecibas ===
export function calcAttiecibasNumbers(dateStr: string) {
  const [dRaw, mRaw, yRaw] = dateStr.split(".").map(Number);

  const dayReduced = reduce22(dRaw);
  const month = mRaw;
  const yearSum = yRaw.toString().split("").reduce((a, b) => a + Number(b), 0);
  const yearReduced = reduce22(yearSum);

  const top = reduce22(dayReduced + month + yearReduced);
  const combo = reduce22(dRaw + mRaw + yearSum + top);
  const bottomRight = reduce22(top + combo);
  const bottomLeft = reduce22(top + yearReduced);
  const midRight = reduce22(top + bottomRight);
  const midLeft = reduce22(top + bottomLeft);
  const midBottom = reduce22(bottomRight + bottomLeft);

  return { top, bottomRight, bottomLeft, midRight, midLeft, midBottom };
}

// === Geometry (уменьшенная) ===
const TRI = {
  top: { x: W / 2, y: 25 },
  left: { x: W / 2 - 60, y: H - 30 },
  right: { x: W / 2 + 60, y: H - 30 },
};

function mid(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

// === Draw helpers ===
function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, num: number) {
  ctx.shadowColor = "rgba(255,76,76,0.45)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT_FILL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = ACCENT_STROKE;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = TXT_COLOR;
  ctx.font = "bold 12px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), x, y);
}

// === MAIN DRAW ===
export function drawTriangleAttiecibasSaderiba(dateStr = "10.08.1990") {
  const nums = calcAttiecibasNumbers(dateStr);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ⚠️ прозрачный фон
  ctx.clearRect(0, 0, W, H);

  // линии треугольника
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(TRI.top.x, TRI.top.y);
  ctx.lineTo(TRI.left.x, TRI.left.y);
  ctx.lineTo(TRI.right.x, TRI.right.y);
  ctx.closePath();
  ctx.stroke();

  const midLeft = mid(TRI.top, TRI.left);
  const midRight = mid(TRI.top, TRI.right);
  const midBottom = mid(TRI.left, TRI.right);

  const points = [
    { ...TRI.top, val: nums.top },
    { ...TRI.right, val: nums.bottomRight },
    { ...TRI.left, val: nums.bottomLeft },
    { ...midRight, val: nums.midRight },
    { ...midLeft, val: nums.midLeft },
    { ...midBottom, val: nums.midBottom },
  ];

  for (const p of points) {
    drawNode(ctx, p.x, p.y, p.val);
  }

  return canvas;
}
