// lib/starMath.ts
export type StarNumbers = {
  outer: { left1: number; top9: number; right6: number; br16: number; bl5: number };
  chakras: number[];   // [6,7,8,9,10] слева-направо
  center: number;      // 11
  all: Record<number, number>; // 12..27
};

function sumDigitsOnce(n: number) {
  let s = 0;
  while (n > 0) {
    s += n % 10;
    n = (n / 10) | 0;
  }
  return s;
}
export function reduce22(n: number) {
  while (n > 22) n = sumDigitsOnce(n);
  return n;
}

export function parseBirth(date: string) {
  const s = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
    return { d, m, y };
  }
  const [a, b, c] = s.split(/[.\-/]/).map((v) => parseInt(v, 10));
  if (a > 31) return { d: c, m: b, y: a };
  return { d: a, m: b, y: c };
}

export function calcStarNumbers(birth: string): StarNumbers {
  const { d, m, y } = parseBirth(birth);

  // 1..5
  const num1 = d > 22 ? reduce22(d) : d;
  const num2 = m;
  const num3 = reduce22(
    y.toString().split("").reduce((s, c) => s + +c, 0)
  );
  const num4 = reduce22(num1 + num2 + num3);
  const num5 = reduce22(num1 + num2 + num3 + num4);

  // чакры 6..10 (как в твоём коде)
  const num7  = reduce22(num1 + num2);
  const num9  = reduce22(num2 + num3);
  const num6  = reduce22(num1 + num7);
  const num8  = reduce22(num7 + num9);
  const num10 = reduce22(num9 + num3);

  // центр
  const num11 = reduce22(num1 + num2 + num3 + num4 + num5);

  // новые опорные
  const num20 = reduce22(num1 + num5);
  const num23 = reduce22(num4 + num5);
  const num26 = reduce22(num3 + num4);

  // внутренние
  const num18 = reduce22(num7 + num20);
  const num15 = reduce22(num9 + num26);
  const num16 = reduce22(num23 + num26);
  const num17 = reduce22(num20 + num23);
  // в этой версии 14 не используется

  // две новые точки (12,13)
  const num12 = reduce22(num7 + num2); // (1+2) + 2
  const num13 = reduce22(num2 + num9); // 2 + (2+3)

  // внешние
  const num19 = reduce22(num1 + num20);
  const num27 = reduce22(num3 + num26);
  const num25 = reduce22(num4 + num26);
  const num24 = reduce22(num4 + num23);
  const num22 = reduce22(num5 + num23);
  const num21 = reduce22(num5 + num20);

  return {
    outer: {
      left1: num1,   // 1 (слева)
      top9:  num2,   // 2 (верх)
      right6: num3,  // 3 (право)
      br16:  num4,   // 4 (низ-право)
      bl5:   num5,   // 5 (низ-лево)
    },
    chakras: [num6, num7, num8, num9, num10], // 6..10 слева-направо
    center: num11, // 11
    all: {
      12: num12,
      13: num13,
      15: num15,
      16: num16,
      17: num17,
      18: num18,
      19: num19,
      20: num20,
      21: num21,
      22: num22,
      23: num23,
      24: num24,
      25: num25,
      26: num26,
      27: num27,
      // 14 — отсутствует в макете (если понадобится — добавим reduce22(num7 + num9))
    },
  };
}
