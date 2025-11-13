// lib/starRenderSaderiba.ts (контрастная версия)
type Point = { x: number; y: number };

// 🔹 Контрастные цвета
const EDGE = "rgba(255,255,255,0.35)";   // линии чуть ярче
const TXT_DIM = "#5a0a0a";               // бордовый текст для светлых кружков
const ACCENT_FILL = "#700000";           // тёмно-бордовый фон (основные)
const ACCENT_STROKE = "#ff4444";         // ярко-красный контур

const W = 420, H = 420;

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

function safeText(v: any) {
  return v === undefined || v === null ? "" : String(v);
}

function badge(p: Point, r: number, fill: string, stroke: string, txt: string, fs: number) {
  return `
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="0.95"/>
    <text x="${p.x}" y="${p.y}" fill="white" font-size="${fs}" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${txt}</text>`;
}

// 🔹 Светлые внутренние кружки с читаемыми цифрами
function whiteDot(id: number, text: string, r = 10) {
  const p = POS[id];
  return `
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#fbeaea" stroke="#ff4c4c" stroke-width="1.2" opacity="0.95"/>
    <text x="${p.x}" y="${p.y}" fill="${TXT_DIM}" font-size="${r < 13 ? 9 : 10}" font-weight="700"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${text}</text>`;
}

export function renderStarSvgSaderiba(numbers: any, size: { width?: number; height?: number } = {}) {
  if (!numbers || !numbers.outer) {
    console.warn("⚠️ renderStarSvgSaderiba: numbers missing");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"></svg>`;
  }
  const width = size.width ?? 900;
  const height = size.height ?? 900;

  const lines = `
  <line x1="35" y1="180" x2="385" y2="180" style="stroke:${EDGE};stroke-width:2"/>
  <line x1="210" y1="50" x2="320" y2="380" style="stroke:${EDGE};stroke-width:2"/>
  <line x1="385" y1="180" x2="100" y2="380" style="stroke:${EDGE};stroke-width:2"/>
  <line x1="100" y1="380" x2="210" y2="50" style="stroke:${EDGE};stroke-width:2"/>
  <line x1="320" y1="380" x2="35" y2="180" style="stroke:${EDGE};stroke-width:2"/>
`;

  // 🌑 Внешние кружки (бордовые)
  const outer = [1,2,3,4,5].map((id,i)=>{
    const key = ["left1","top9","right6","br16","bl5"][i];
    return badge(POS[id],18,ACCENT_FILL,ACCENT_STROKE,safeText(numbers.outer[key]),14);
  }).join("");

  // 🌕 Чакры (малые бордовые)
  const chakras = (numbers.chakras ?? []).map((n:any,i:number)=>
    badge(POS[6+i],13,ACCENT_FILL,ACCENT_STROKE,safeText(n),11)
  ).join("");

  // 🌕 Центральный (белый)
  const center = whiteDot(11, safeText(numbers.center), 15);

  // 🌕 Внутренние (светлые)
  const a = numbers.all ?? {};
  const inner = Object.entries(POS)
    .filter(([id])=>Number(id)>11)
    .map(([id])=>whiteDot(+id, safeText(a[+id]), 10))
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${W} ${H}">
    ${lines}${outer}${chakras}${center}${inner}
  </svg>`;
}
