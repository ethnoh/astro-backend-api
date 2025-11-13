// lib/starRender.ts
type Point = { x: number; y: number };

const BG = "#0b1f1c";
const EDGE = "rgba(255,255,255,0.18)";
const TXT_DIM = "rgba(44,62,64,0.95)";
const ACCENT_FILL = "#20c997";
const ACCENT_STROKE = "#00a072";

const W = 450, H = 450;

// координаты точек как в твоём HTML
export const POS: Record<number, Point> = {
  1: { x: 35,  y: 195 },
  2: { x: 225, y: 55 },
  3: { x: 415, y: 195 },
  4: { x: 345, y: 405 },
  5: { x: 105, y: 405 },

  6: { x: 105, y: 195 },
  7: { x: 175, y: 195 },
  8: { x: 225, y: 195 },
  9: { x: 275, y: 195 },
  10:{ x: 345, y: 195 },

  11:{ x: 225, y: 245 },

  // внутренние
  15:{ x: 280, y: 235 },
  16:{ x: 255, y: 290 },
  17:{ x: 195, y: 290 },
  18:{ x: 170, y: 235 },

  // новые 12 и 13 (над горизонталью)
  12:{ x: 190, y: 125 },
  13:{ x: 260, y: 125 },

  // внешние
  19:{ x: 95,  y: 245 },
  20:{ x: 140, y: 280 },
  21:{ x: 120, y: 330 },
  22:{ x: 180, y: 370 },
  23:{ x: 225, y: 330 },
  24:{ x: 270, y: 370 },
  25:{ x: 330, y: 330 },
  26:{ x: 310, y: 280 },
  27:{ x: 355, y: 245 },
};

function bigBadge(id: number, text: string) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="20" fill="${ACCENT_FILL}" stroke="${ACCENT_STROKE}" stroke-width="2"/>
    <text x="${p.x}" y="${p.y}" fill="white" font-size="16" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}
function smallBadge(id: number, text: string) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="15" fill="${ACCENT_FILL}" stroke="${ACCENT_STROKE}" stroke-width="1" opacity="0.85"/>
    <text x="${p.x}" y="${p.y}" fill="white" font-size="12" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}
function whiteDot(id: number, text: string, r = 12) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#f0f0f0" stroke="${ACCENT_STROKE}" stroke-width="2" opacity="0.9"/>
    <text x="${p.x}" y="${p.y}" fill="${TXT_DIM}" font-size="${r < 15 ? 10 : 12}" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}

export function renderStarSvg(
  numbers: {
    outer: { left1: number; top9: number; right6: number; br16: number; bl5: number };
    chakras: number[]; // [6,7,8,9,10]
    center: number;    // 11
    all: Record<number, number>; // 12..27
  },
  size: { width?: number; height?: number } = {}
) {
  const width = size.width ?? 1000;
  const height = size.height ?? 1000;

  const lines = `
    <line x1="35"  y1="195" x2="415" y2="195" style="stroke:${EDGE};stroke-width:2"/>
    <line x1="225" y1="55"  x2="345" y2="405" style="stroke:${EDGE};stroke-width:2"/>
    <line x1="415" y1="195" x2="105" y2="405" style="stroke:${EDGE};stroke-width:2"/>
    <line x1="105" y1="405" x2="225" y2="55"  style="stroke:${EDGE};stroke-width:2"/>
    <line x1="345" y1="405" x2="35"  y2="195" style="stroke:${EDGE};stroke-width:2"/>
  `;

  const outer =
    bigBadge(1, String(numbers.outer.left1)) +
    bigBadge(2, String(numbers.outer.top9)) +
    bigBadge(3, String(numbers.outer.right6)) +
    bigBadge(4, String(numbers.outer.br16)) +
    bigBadge(5, String(numbers.outer.bl5));

  const [n6, n7, n8, n9, n10] = numbers.chakras;
  const chakras =
    smallBadge(6, String(n6)) +
    smallBadge(7, String(n7)) +
    smallBadge(8, String(n8)) +
    smallBadge(9, String(n9)) +
    smallBadge(10, String(n10));

  const center = whiteDot(11, String(numbers.center), 18);

  const a = numbers.all;
  const inner =
    whiteDot(20, String(a[20] ?? ""), 15) +
    whiteDot(23, String(a[23] ?? ""), 15) +
    whiteDot(26, String(a[26] ?? ""), 15) +
    whiteDot(18, String(a[18] ?? "")) +
    whiteDot(15, String(a[15] ?? "")) +
    whiteDot(17, String(a[17] ?? "")) +
    whiteDot(16, String(a[16] ?? "")) +
    // 14 отсутствует в твоём шаблоне
    whiteDot(12, String(a[12] ?? "")) +
    whiteDot(13, String(a[13] ?? "")) +
    whiteDot(19, String(a[19] ?? "")) +
    whiteDot(27, String(a[27] ?? "")) +
    whiteDot(25, String(a[25] ?? "")) +
    whiteDot(24, String(a[24] ?? "")) +
    whiteDot(22, String(a[22] ?? "")) +
    whiteDot(21, String(a[21] ?? ""));

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${lines}
  ${outer}
  ${chakras}
  ${center}
  ${inner}
</svg>`;
}
