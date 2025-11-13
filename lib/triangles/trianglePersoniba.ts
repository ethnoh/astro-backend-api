import { createCanvas, CanvasRenderingContext2D } from "canvas";

// === COLORS ===
const BG = "#0b1f1c";
const EDGE = "rgba(255,255,255,0.18)";
const ACCENT_FILL = "#20c997";
const ACCENT_STROKE = "#00a072";

const W = 600;
const H = 500;

// === Reduce any number until <= 22 ===
function reduce22(num: number): number {
  while (num > 22) {
    num = num
      .toString()
      .split("")
      .reduce((a, b) => a + parseInt(b), 0);
  }
  return num;
}

// === Core math for Personība ===
function calcPersonibaNumbers(dateStr: string) {
  const [d, m, y] = dateStr.split(".").map(Number);

  // Reduce helpers
  const d1 = reduce22(d);                              // день в редукции (напр. 28 -> 10)
  const ySum = y.toString().split("").reduce((a, b) => a + parseInt(b), 0);
  const yR = reduce22(ySum);                           // год в редукции (напр. 1997 -> 26 -> 8)

  // (1) Top — редуцированный день
  const top = d1;

  // (2) Bottom right — день (в редукции) + месяц (как есть)
  const bottomRight = reduce22(d1 + m);

  // (3) Bottom left — каскад (месяц берём КАК ЕСТЬ)
  const part1 = d1;            // reduce22(d)
  const part2 = m;             // <— ВАЖНО: месяц без редукции
  const part3 = yR;            // reduce22(сумма цифр года)
  const part4 = reduce22(part1 + part2 + part3);
  const part5 = reduce22(part1 + part2 + part3 + part4);
  const bottomLeft = reduce22(part1 + part5);

  // Middles
  const midRight = reduce22(top + bottomRight);
  const midLeft = reduce22(top + bottomLeft);
  const midBottom = reduce22(bottomRight + bottomLeft);

  return { top, bottomRight, bottomLeft, midRight, midLeft, midBottom };
}


// === Draw helpers ===
function drawStarOuterPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.shadowColor = "rgba(32, 201, 151, 0.45)";
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
export function drawTriangleBase(dateStr = "10.08.1990") {
  const nums = calcPersonibaNumbers(dateStr);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // triangle edges
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(TRI.top.x, TRI.top.y);
  ctx.lineTo(TRI.left.x, TRI.left.y);
  ctx.lineTo(TRI.right.x, TRI.right.y);
  ctx.closePath();
  ctx.stroke();

  // positions
  const midLeft = mid(TRI.top, TRI.left);
  const midRight = mid(TRI.top, TRI.right);
  const midBottom = mid(TRI.left, TRI.right);

  // draw points
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
