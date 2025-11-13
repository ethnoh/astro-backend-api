import { createCanvas, CanvasRenderingContext2D } from "canvas";

// === COLORS ===
const BG = "#0b1f1c";
const EDGE = "rgba(255,255,255,0.18)";
const ACCENT_FILL = "#20c997";
const ACCENT_STROKE = "#00a072";

const W = 600;
const H = 500;

// === Helper: reduce to <= 22 ===
function reduce22(num: number): number {
  while (num > 22) {
    num = num
      .toString()
      .split("")
      .reduce((a, b) => a + parseInt(b), 0);
  }
  return num;
}

// === Core math for Attiecibas ===
function calcAttiecibasNumbers(dateStr: string) {
  const [dRaw, mRaw, yRaw] = dateStr.split(".").map(Number);

  // 1️⃣ Reduce parts
  const dayReduced = reduce22(dRaw);
  const month = mRaw; // месяц НЕ ужимаем
  const yearSum = yRaw.toString().split("").reduce((a, b) => a + Number(b), 0);
  const yearReduced = reduce22(yearSum);

  // (1) Верхняя = день↓ + месяц + год↓ (и результат ↓)
  const top = reduce22(dayReduced + month + yearReduced);

  // внутренняя сумма для (2)
  const combo = reduce22(dRaw + mRaw + yearSum + top);

  // (2) Нижняя правая = (1) + (день + месяц + год + (1))
  const bottomRight = reduce22(top + combo);

  // (3) Нижняя левая = (1) + год↓
  const bottomLeft = reduce22(top + yearReduced);

  // (4) Средняя правая = (1) + (2)
  const midRight = reduce22(top + bottomRight);

  // (5) Средняя левая = (1) + (3)
  const midLeft = reduce22(top + bottomLeft);

  // (6) Средняя нижняя = (2) + (3)
  const midBottom = reduce22(bottomRight + bottomLeft);

  console.log({
    dateStr,
    dayReduced,
    month,
    yearReduced,
    top,
    combo,
    bottomRight,
    bottomLeft,
    midRight,
    midLeft,
    midBottom,
  });

  return { top, bottomRight, bottomLeft, midRight, midLeft, midBottom };
}

// === Draw helpers ===
function drawStarOuterPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.shadowColor = "rgba(32,201,151,0.45)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT_FILL;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = ACCENT_STROKE;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawNumber(ctx: CanvasRenderingContext2D, x: number, y: number, num: number) {
  ctx.fillStyle = "white";
  ctx.font = "bold 20px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), x, y);
}

// === Geometry ===
const TRI = {
  top: { x: W / 2, y: 70 },
  left: { x: W / 2 - 150, y: H - 90 },
  right: { x: W / 2 + 150, y: H - 90 },
};

function mid(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

// === MAIN DRAW ===
export function drawTriangleAttiecibas(dateStr = "10.08.1990") {
  const nums = calcAttiecibasNumbers(dateStr);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.8;
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
    drawStarOuterPoint(ctx, p.x, p.y);
    drawNumber(ctx, p.x, p.y, p.val);
  }

  return canvas;
}
