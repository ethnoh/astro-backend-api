// lib/starRenderSaderibaSum.ts
type Point = { x: number; y: number };

// === COLORS ===
const EDGE = "rgba(255,255,255,0.4)";
const TXT_DIM = "#fff";
const ACCENT_FILL = "#800000";
const ACCENT_STROKE = "#ff4c4c";

const W = 420;
const H = 420;

// === POSITIONS ===
export const POS: Record<number, Point> = {
  1: { x: 35,  y: 180 },  // left
  2: { x: 210, y: 50 },   // top
  3: { x: 385, y: 180 },  // right
  4: { x: 320, y: 380 },  // bottom-right
  5: { x: 100, y: 380 },  // bottom-left
};

// === LINES ===
const lines = `
  <line x1="35" y1="180" x2="385" y2="180" stroke="${EDGE}" stroke-width="2"/>
  <line x1="210" y1="50"  x2="320" y2="380" stroke="${EDGE}" stroke-width="2"/>
  <line x1="385" y1="180" x2="100" y2="380" stroke="${EDGE}" stroke-width="2"/>
  <line x1="100" y1="380" x2="210" y2="50"  stroke="${EDGE}" stroke-width="2"/>
  <line x1="320" y1="380" x2="35"  y2="180" stroke="${EDGE}" stroke-width="2"/>
`;

// === HELPERS ===

// редукция "до ≤22"
function reduce22(n: number): number {
  while (n > 22) {
    n = String(n)
      .split("")
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return n;
}

// редукция "до одной цифры" (1–9)
function reduce9(n: number): number {
  while (n > 9) {
    n = String(n)
      .split("")
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return n;
}

function badge(id: number, text: string) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="16"
      fill="${ACCENT_FILL}" stroke="${ACCENT_STROKE}"
      stroke-width="2" opacity="0.95"/>
    <text x="${p.x}" y="${p.y}" fill="${TXT_DIM}"
      font-size="13" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>
  `;
}

// === MAIN ===
export function renderStarSvgSaderibaSum(
  you: { outer: { left1: number; top9: number; right6: number; br16: number; bl5: number } },
  partner: { outer: { left1: number; top9: number; right6: number; br16: number; bl5: number } },
  size: { width?: number; height?: number } = {}
) {
  const width = size.width ?? 360;
  const height = size.height ?? 360;

  // суммируем все вершины
  let sumOuter = {
    left1: you.outer.left1 + partner.outer.left1,
    top9:  you.outer.top9  + partner.outer.top9,
    right6: you.outer.right6 + partner.outer.right6,
    br16:  you.outer.br16  + partner.outer.br16,
    bl5:   you.outer.bl5   + partner.outer.bl5,
  };

  // редукция по правилам
  sumOuter = {
    left1: reduce22(sumOuter.left1),
    top9:  reduce22(sumOuter.top9),
    right6: reduce22(sumOuter.right6),
    // 🔻 нижние вершины — редуцируем до одной цифры даже если ≤22
    br16:  reduce9(sumOuter.br16),
    bl5:   reduce9(sumOuter.bl5),
  };

  const outer =
    badge(1, String(sumOuter.left1)) +
    badge(2, String(sumOuter.top9)) +
    badge(3, String(sumOuter.right6)) +
    badge(4, String(sumOuter.br16)) +
    badge(5, String(sumOuter.bl5));

  return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}"
     viewBox="0 0 ${W} ${H}">
  ${lines}
  ${outer}
</svg>`;
}
