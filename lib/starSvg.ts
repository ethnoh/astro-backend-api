// lib/starSvg.ts
import type { StarNumbers } from "./star";

/** Visual options */
type SvgOptions = {
  size?: number;
  bg?: string;
  starFill?: string;
  starStroke?: string;
  gridStroke?: string;
  tipFill?: string;
  textFill?: string;
  fontFamily?: string;
  tweakPx?: Partial<Record<number,[number,number]>>; // per-index pixel nudge [dx,dy]
};

const DEF: Required<Omit<SvgOptions,"tweakPx">> & { tweakPx: NonNullable<SvgOptions["tweakPx"]> } = {
  size: 1200,
  bg: "#0b1f1c",
  starFill: "#0f2b26",
  starStroke: "rgba(255,255,255,0.14)",
  gridStroke: "rgba(255,255,255,0.16)",
  tipFill: "#34d399",
  textFill: "rgba(255,255,255,0.92)",
  fontFamily: "Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  tweakPx: {},
};

const scaleN = (n: number, size: number) => Math.round(n * size);
const textNode = (x:number,y:number,t:string,fill:string,ff:string,fs:number) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${ff}" font-size="${fs}" text-anchor="middle" dominant-baseline="middle">${t}</text>`;

function geom(size:number){
  const cx=0.5, cy=0.5;
  const R=0.40, r=0.155;
  const startDeg = -180; // 1 на левом луче

  const tips: Array<[number,number]> = [];
  const inner: Array<[number,number]> = [];
  for(let k=0;k<5;k++){
    const aOuter = (startDeg + k*72) * Math.PI/180;
    const aInner = aOuter + 36*Math.PI/180;
    tips.push([cx + R*Math.cos(aOuter), cy + R*Math.sin(aOuter)]);
    inner.push([cx + r*Math.cos(aInner), cy + r*Math.sin(aInner)]);
  }

  const starPts: string[] = [];
  for(let i=0;i<5;i++){
    starPts.push(`${tips[i][0]},${tips[i][1]}`, `${inner[i][0]},${inner[i][1]}`);
  }

  // Базовые якоря (1..5 = внешние вершины, 6 = центр)
  const A: Record<number,[number,number]> = {
    1: tips[0],
    2: tips[1],
    3: tips[2],
    4: tips[3],
    5: tips[4],
    6: [cx, cy],
  };

  // Горизонтальная «чакровая» линия 7..11 между 1 и 3 (чуть приподнял)
  const [xL,yL]=A[1]; const [xR,yR]=A[3];
  const yShift = -0.015;
  for(let i=0;i<5;i++){
    const t=(i+1)/6; // 1/6..5/6
    const x= xL + (xR-xL)*t;
    const y= yL + (yR-yL)*t + yShift;
    A[7+i]=[x,y];
  }

  // helpers
  const center:[number,number]=[cx,cy];
  const mix = (p:[number,number], q:[number,number], t:number) : [number,number] =>
    [p[0] + (q[0]-p[0])*t, p[1] + (q[1]-p[1])*t];
  const towardC = (p:[number,number], k:number):[number,number]=>{
    const [x,y]=p; const vx = center[0]-x, vy=center[1]-y;
    return [x + vx*k, y + vy*k];
  }
  const P=(i:number)=>A[i];

  // Внутренние 12..26 — по схеме пар (ставлю ближе к правильным зонам)
  const wEdge=0.38, wNear=0.44, wMid=0.5;

  A[12] = towardC(mix(P(1),  P(7),  wEdge), 0.06);
  A[13] = towardC(mix(P(1),  P(11), wEdge), 0.06);
  A[14] = towardC(mix(P(7),  P(11), wMid ), 0.04);

  A[15] = towardC(mix(P(7),  P(2),  wNear), 0.02);
  A[16] = towardC(mix(P(8),  P(2),  wNear), 0.02);
  A[17] = towardC(mix(P(7),  P(8),  wMid ), 0.02);

  A[18] = towardC(mix(P(3),  P(8),  wEdge), 0.06);
  A[19] = towardC(mix(P(3),  P(9),  wEdge), 0.06);
  A[20] = towardC(mix(P(8),  P(9),  wMid ), 0.04);

  A[21] = towardC(mix(P(4),  P(9),  wNear), 0.03);
  A[22] = towardC(mix(P(4),  P(10), wNear), 0.03);
  A[23] = towardC(mix(P(9),  P(10), wMid ), 0.05);

  A[24] = towardC(mix(P(5),  P(10), wEdge), 0.06);
  A[25] = towardC(mix(P(5),  P(11), wEdge), 0.06);
  A[26] = towardC(mix(P(11), P(10), 0.58 ), 0.05);

  // Пентаграмма (соединяем через одну вершину)
  const starLines: Array<[[number,number],[number,number]]> = [];
  const order=[1,3,5,2,4,1];
  for(let i=0;i<order.length-1;i++){
    starLines.push([A[order[i]], A[order[i+1]]]);
  }
  const chakraLine: [[number,number],[number,number]] = [A[1], A[3]];

  return { starPts, A, starLines, chakraLine };
}

/** Build SVG */
export function buildStarSVG(nums: StarNumbers, opts: SvgOptions = {}){
  const o = { ...DEF, ...opts };
  const S = o.size;
  const { starPts, A, starLines, chakraLine } = geom(S);
  const mapPoint = (p:[number,number]) => [scaleN(p[0],S), scaleN(p[1],S)] as [number,number];

  const polygon = starPts.map(p=>{
    const [x,y] = p.split(",").map(Number);
    const [X,Y]=mapPoint([x,y]);
    return `${X},${Y}`;
  }).join(" ");

  const starLinesSVG = starLines.map(([p,q])=>{
    const [x1,y1]=mapPoint(p), [x2,y2]=mapPoint(q);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.gridStroke}" stroke-width="6"/>`;
  }).join("");

  const [cl1, cl2]=chakraLine;
  const [cx1,cy1]=mapPoint(cl1), [cx2,cy2]=mapPoint(cl2);
  const chakraSVG = `<line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}" stroke="${o.gridStroke}" stroke-width="6"/>`;

  const tipSet = new Set([1,2,3,4,5]);

  const labelsSVG = Array.from({length:26},(_,i)=>i+1).map(i=>{
    let [x,y]=mapPoint(A[i]);
    const tweak = o.tweakPx[i as keyof NonNullable<typeof o.tweakPx>];
    if(tweak){ x += tweak[0]; y += tweak[1]; }
    const fs = tipSet.has(i) ? 56 : (i<=11 ? 40 : 32);
    const fill = tipSet.has(i) ? o.tipFill : o.textFill;
    return textNode(x,y,String(nums[i as keyof StarNumbers]),fill,o.fontFamily,fs);
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <rect width="100%" height="100%" fill="${o.bg}"/>
  <polygon points="${polygon}" fill="${o.starFill}" stroke="${o.starStroke}" stroke-width="6"/>
  ${starLinesSVG}
  ${chakraSVG}
  ${labelsSVG}
</svg>`;
}

/** PNG via sharp */
export async function starPngBuffer(nums: StarNumbers, opts?: SvgOptions){
  const svg = buildStarSVG(nums, opts);
  const sharp = (await import("sharp")).default;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { svg, png };
}
