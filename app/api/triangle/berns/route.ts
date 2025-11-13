import "@/lib/registerFont";
import { NextRequest, NextResponse } from "next/server";
import { drawTrianglePersonibaBerns } from "@/lib/triangles/trianglePersonibaBerns";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "10.08.1990";

  // 🟢 Рисуем прозрачный треугольник
  const canvas = drawTrianglePersonibaBerns(date);

  // Конвертируем в PNG
  const buffer = canvas.toBuffer("image/png");
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
