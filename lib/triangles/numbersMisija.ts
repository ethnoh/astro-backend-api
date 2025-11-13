import { createCanvas, CanvasRenderingContext2D, loadImage } from "canvas";
import * as fs from "fs";
import * as path from "path";

const ACCENT_FILL = "#20c997";
const ACCENT_STROKE = "#00a072";
const W = 1366;
const H = 768;

function reduce22(num: number): number {
  while (num > 22) {
    num = num.toString().split("").reduce((a, b) => a + Number(b), 0);
  }
  return num;
}

function calcNumbersMisija(dateStr: string) {
  const [dRaw, mRaw, yRaw] = dateStr.split(".").map(Number);
  const day = reduce22(dRaw);
  const month = mRaw;
  const yearDigits = yRaw.toString().split("").reduce((a, b) => a + Number(b), 0);
  const year = reduce22(yearDigits);

  const n1 = day, n2 = month, n3 = year;
  const n4 = reduce22(day + month + year);
  const n5 = reduce22(day + month + year + n4);
  const n6 = reduce22(n1 + n2 + n3 + n4 + n5);
  const n7 = reduce22(n1 + n2);
  const n8 = reduce22(n2 + n3);
  const n9 = reduce22(n3 + n4);
  const n10 = reduce22(n4 + n5);
  const n11 = reduce22(n5 + n1);

  const first = n6;
  const second = reduce22(n7 + n8 + n9 + n10 + n11);
  const third = reduce22(first + second);

  return { first, second, third };
}

// --- robust bg resolver ---
async function loadBackground(bgParam?: string) {
  // 1) если передали URL в ?bg=, пробуем его
  if (bgParam && /^https?:\/\//i.test(bgParam)) {
    return await loadImage(bgParam);
  }
  // 2) если передали относительный путь в проекте
  if (bgParam && !/^https?:\/\//i.test(bgParam)) {
    const abs = path.isAbsolute(bgParam) ? bgParam : path.join(process.cwd(), bgParam);
    if (fs.existsSync(abs)) return await loadImage(abs);
  }
  // 3) дефолт: public/images/misija.jpg
  const fromPublic = path.join(process.cwd(), "public", "images", "misija.jpg");
  if (fs.existsSync(fromPublic)) return await loadImage(fromPublic);

  // 4) fallback: просто однотонный фон
  return null;
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.shadowColor = "rgba(32,201,151,0.45)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, 50, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT_FILL;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ACCENT_STROKE;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "white";
  ctx.font = "bold 38px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

export async function drawNumbersMisija(dateStr = "10.08.1990", bgParam?: string) {
  const nums = calcNumbersMisija(dateStr);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = await loadBackground(bgParam);
  if (bg) {
    ctx.drawImage(bg as any, 0, 0, W, H);
  } else {
    // fallback фон (как раньше)
    ctx.fillStyle = "#0b1f1c";
    ctx.fillRect(0, 0, W, H);
  }

  // координаты под заголовком MISIJA
  const baseY = 190;
  const spacing = 230;
  //const baseX = W / 2 - spacing;
  // ✅ теперь ровно по центру всей группы (три кружка)
  const totalWidth = spacing * 2;
  const baseX = W / 2 - totalWidth / 2 + 30;


  drawCircle(ctx, baseX, baseY, String(nums.first));
  drawCircle(ctx, baseX + spacing, baseY, String(nums.second));
  drawCircle(ctx, baseX + spacing * 2, baseY, String(nums.third));

  return canvas;
}
