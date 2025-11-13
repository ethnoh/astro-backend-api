// lib/star.ts
export type StarNumbers = Record<number, number>;

function reduce22(n: number): number {
  // сводим к числу ≤22, суммируя цифры
  while (n > 22) n = String(n).split("").reduce((a, b) => a + Number(b), 0);
  return n;
}
const sr = (...vals: number[]) => reduce22(vals.reduce((a, b) => a + b, 0));

export function parseBirthDate(ddmmyyyy: string) {
  const m = ddmmyyyy.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) throw new Error("Nepareizs datuma formāts. Izmanto dd.mm.gggg");
  const [_, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12) throw new Error("Nepareizs mēnesis");
  if (day < 1 || day > 31) throw new Error("Nepareiza diena");
  return { day, month, year };
}

export function calcStar(ddmmyyyy: string): StarNumbers {
  const { day, month, year } = parseBirthDate(ddmmyyyy);

  // 1–3
  const n1 = day <= 22 ? day : reduce22(day);                   // Dzimšanas diena (22<) — paliek kā ir līdz 22, virs saskaitīt. :contentReference[oaicite:3]{index=3}
  const n2 = month;                                             // Mēnesis 1–12. :contentReference[oaicite:4]{index=4}
  const n3 = reduce22(String(year).split("").reduce((a,b)=>a+Number(b),0)); // Gads (summa līdz ≤22). :contentReference[oaicite:5]{index=5}

  // 4–6 (kumulatīvi) :contentReference[oaicite:6]{index=6}
  const n4 = sr(n1, n2, n3);
  const n5 = sr(n1, n2, n3, n4);
  const n6 = sr(n1, n2, n3, n4, n5);

  // 7–11 (pāri) :contentReference[oaicite:7]{index=7}
  const n7 = sr(n1, n2);
  const n8 = sr(n2, n3);
  const n9 = sr(n3, n4);
  const n10 = sr(n4, n5);
  const n11 = sr(n5, n1);

  // 12–26 (trijstūru malas/virsotnes no shēmas) :contentReference[oaicite:8]{index=8}
  const n12 = sr(n1, n7);
  const n13 = sr(n1, n11);
  const n14 = sr(n7, n11);
  const n15 = sr(n7, n2);
  const n16 = sr(n8, n2);
  const n17 = sr(n7, n8);
  const n18 = sr(n3, n8);
  const n19 = sr(n3, n9);
  const n20 = sr(n8, n9);
  const n21 = sr(n4, n9);
  const n22 = sr(n4, n10);
  const n23 = sr(n9, n10);
  const n24 = sr(n5, n10);
  const n25 = sr(n5, n11);
  const n26 = sr(n11, n10);

  return {
    1: n1, 2: n2, 3: n3, 4: n4, 5: n5, 6: n6,
    7: n7, 8: n8, 9: n9, 10: n10, 11: n11,
    12: n12, 13: n13, 14: n14, 15: n15, 16: n16, 17: n17,
    18: n18, 19: n19, 20: n20, 21: n21, 22: n22, 23: n23,
    24: n24, 25: n25, 26: n26,
  };
}
