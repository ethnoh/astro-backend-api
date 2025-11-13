// lib/starRenderBerns.ts
type Point = { x: number; y: number };

const EDGE = "rgba(255,255,255,0.18)";
const TXT_DIM = "rgba(44,62,64,0.95)";
const ACCENT_FILL = "#20c997";
const ACCENT_STROKE = "#00a072";

const W = 420, H = 420;

// координаты те же, но звезда чуть меньше
export const POS: Record<number, Point> = {
  1: { x: 35,  y: 180 },
  2: { x: 210, y: 50 },
  3: { x: 385, y: 180 },
  4: { x: 320, y: 380 },
  5: { x: 100, y: 380 },

  6: { x: 105, y: 180 },
  7: { x: 165, y: 180 },
  8: { x: 210, y: 180 },
  9: { x: 255, y: 180 },
  10:{ x: 315, y: 180 },

  11:{ x: 210, y: 230 },

  15:{ x: 265, y: 220 },
  16:{ x: 245, y: 270 },
  17:{ x: 175, y: 270 },
  18:{ x: 155, y: 220 },

  12:{ x: 175, y: 115 },
  13:{ x: 245, y: 115 },

  19:{ x: 90,  y: 230 },
  20:{ x: 135, y: 260 },
  21:{ x: 115, y: 310 },
  22:{ x: 170, y: 350 },
  23:{ x: 210, y: 310 },
  24:{ x: 255, y: 350 },
  25:{ x: 310, y: 310 },
  26:{ x: 290, y: 260 },
  27:{ x: 335, y: 230 },
};

function bigBadge(id: number, text: string) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="18" fill="${ACCENT_FILL}" stroke="${ACCENT_STROKE}" stroke-width="2"/>
    <text x="${p.x}" y="${p.y}" fill="white" font-size="14" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}
function smallBadge(id: number, text: string) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="13" fill="${ACCENT_FILL}" stroke="${ACCENT_STROKE}" stroke-width="1" opacity="0.85"/>
    <text x="${p.x}" y="${p.y}" fill="white" font-size="11" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}
function whiteDot(id: number, text: string, r = 10) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#f0f0f0" stroke="${ACCENT_STROKE}" stroke-width="2" opacity="0.9"/>
    <text x="${p.x}" y="${p.y}" fill="${TXT_DIM}" font-size="${r < 13 ? 9 : 10}" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}

export function renderStarSvgBerns(
  numbers: {
    outer: { left1: number; top9: number; right6: number; br16: number; bl5: number };
    chakras: number[];
    center: number;
    all: Record<number, number>;
  },
  size: { width?: number; height?: number } = {}
) {
  const width = size.width ?? 900;
  const height = size.height ?? 900;

  const lines = `
    <line x1="35"  y1="180" x2="385" y2="180" style="stroke:${EDGE};stroke-width:2"/>
    <line x1="210" y1="50"  x2="320" y2="380" style="stroke:${EDGE};stroke-width:2"/>
    <line x1="385" y1="180" x2="100" y2="380" style="stroke:${EDGE};stroke-width:2"/>
    <line x1="100" y1="380" x2="210" y2="50"  style="stroke:${EDGE};stroke-width:2"/>
    <line x1="320" y1="380" x2="35"  y2="180" style="stroke:${EDGE};stroke-width:2"/>
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

  const center = whiteDot(11, String(numbers.center), 15);

  const a = numbers.all;
  const inner =
    whiteDot(20, String(a[20] ?? ""), 12) +
    whiteDot(23, String(a[23] ?? ""), 12) +
    whiteDot(26, String(a[26] ?? ""), 12) +
    whiteDot(18, String(a[18] ?? "")) +
    whiteDot(15, String(a[15] ?? "")) +
    whiteDot(17, String(a[17] ?? "")) +
    whiteDot(16, String(a[16] ?? "")) +
    whiteDot(12, String(a[12] ?? "")) +
    whiteDot(13, String(a[13] ?? "")) +
    whiteDot(19, String(a[19] ?? "")) +
    whiteDot(27, String(a[27] ?? "")) +
    whiteDot(25, String(a[25] ?? "")) +
    whiteDot(24, String(a[24] ?? "")) +
    whiteDot(22, String(a[22] ?? "")) +
    whiteDot(21, String(a[21] ?? ""));

  // ⚠️ нет фона!
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${W} ${H}">
  ${lines}
  ${outer}
  ${chakras}
  ${center}
  ${inner}
</svg>`;
}
