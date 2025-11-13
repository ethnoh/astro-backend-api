import "@/lib/registerFont";
import { NextRequest, NextResponse } from "next/server";
import { drawTriangleAttiecibasSaderiba, calcAttiecibasNumbers } from "@/lib/triangles/triangleAttiecibasSaderiba";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "10.08.1990";
  const format = (searchParams.get("format") || "png").toLowerCase();

  // 🔹 Если формат JSON — просто вернуть числа
  if (format === "json" || format === "numbers") {
    const nums = calcAttiecibasNumbers(date);
    return NextResponse.json(nums, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  // 🔹 Иначе отрисовываем PNG
  const canvas = drawTriangleAttiecibasSaderiba(date);
  const buffer = canvas.toBuffer("image/png");
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
