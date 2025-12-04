import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------- Safe Supabase init ----------
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

let supabase: any = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ---------- CORS ----------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ---------- OPTIONS ----------
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

// ---------- HELPERS ----------
function reduce22(n: number): number {
  return n <= 22
    ? n
    : n
        .toString()
        .split("")
        .map(Number)
        .reduce((a, b) => a + b, 0);
}

// OFFSET = сумма цифр года (как в твоей таблице)
function yearOffset(year: number): number {
  return year
    .toString()
    .split("")
    .map(Number)
    .reduce((a, b) => a + b, 0);
}
/* dfsd*/

function personalYear(day: number, month: number, year: number): number {
  const offset = yearOffset(year);

  let s1 = day + month;
  if (s1 > 22) {
    s1 = reduce22(s1);
  }

  let s2 = s1 + offset;
  if (s2 > 22) {
    s2 = reduce22(s2);
  }

  return s2;
}

function dailyNumber(dob: Date, target: Date): number {
  const py = personalYear(
    dob.getDate(),
    dob.getMonth() + 1,
    target.getFullYear()
  );

  let total = py + (target.getMonth() + 1);
  if (total > 22) {
    total = reduce22(total);
  }

  total += target.getDate();
  if (total > 22) {
    total = reduce22(total);
  }

  return total;
}

function parseDob(input: string): Date {
  const s = input.trim();
  const fmts = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  ];
  for (const re of fmts) {
    const m = s.match(re);
    if (m) {
      if (re === fmts[0]) {
        const [, dd, mm, yyyy] = m;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      }
      if (re === fmts[1]) {
        const [, yyyy, mm, dd] = m;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      }
      if (re === fmts[2]) {
        const [, dd, mm, yyyy] = m;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      }
    }
  }
  throw new Error("Invalid birthDate format.");
}

function dayOfYearUTC(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((cur - start) / 86400000) + 1;
}

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return new NextResponse(JSON.stringify({ error: "date param required" }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      });
    }

    const dob = parseDob(date);
    const today = new Date();
    const num = dailyNumber(dob, today);

    const { data, error } = await supabase
      .from("daily_texts")
      .select("number, lang, variant, title, content")
      .eq("lang", "lv")
      .eq("number", num)
      .order("variant", { ascending: true });

    if (error) {
      return new NextResponse(
        JSON.stringify({ error: "DB error", details: error.message }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!data || data.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "No forecast found", details: `number=${num}` }),
        {
          status: 404,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const doy = dayOfYearUTC(today);
    const pick = data[doy % data.length];

    return new NextResponse(
      JSON.stringify({
        dailyNumber: num,
        forecast: {
          title: `Cipars ${num}`,
          content: pick.content,
        },
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: "Server error", details: e.message }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
