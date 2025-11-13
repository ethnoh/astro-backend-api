import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------- Supabase (server only) ----------
const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
const SUPABASE_KEY =
  (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) ||
  (process.env.SUPABASE_ANON_KEY as string | undefined);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in env (.env.local).");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- helpers ----------
function reduce22(n: number): number {
  return n <= 22
    ? n
    : n
        .toString()
        .split("")
        .map(Number)
        .reduce((a, b) => a + b, 0);
}

// офсеты из тз
const YEAR_OFFSETS: Record<number, number> = { 2025: 9, 2026: 10 };

function personalYear(day: number, month: number, year: number): number {
  const offset = YEAR_OFFSETS[year];
  if (offset == null) throw new Error(`No offset for target year ${year}`);
  const dPrime = day > 22 ? reduce22(day) : day;
  return reduce22(dPrime + month + offset);
}

function dailyNumber(dob: Date, target: Date): number {
  const py = personalYear(dob.getDate(), dob.getMonth() + 1, target.getFullYear());
  const dayPrime = target.getDate() > 22 ? reduce22(target.getDate()) : target.getDate();
  return reduce22(py + (target.getMonth() + 1) + dayPrime);
}

function parseDob(input: string): Date {
  const s = input.trim();
  const fmts = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
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
  throw new Error("Invalid birthDate format. Expected DD.MM.YYYY");
}

function dayOfYearUTC(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((cur - start) / 86400000) + 1;
}

// ---------- API (GET version) ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "date param required" }, { status: 400 });
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
      return NextResponse.json({ error: "DB error", details: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No forecast found", details: `number=${num}, lang=lv` },
        { status: 404 }
      );
    }

    const doy = dayOfYearUTC(today);
    const pick = data[doy % data.length];

    return NextResponse.json({
      dailyNumber: num,
      forecast: {
        title: `Cipars ${num}`,
        content: pick.content
      }
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
