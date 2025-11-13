import { NextRequest, NextResponse } from "next/server";
import { drawTriangleBase } from "@/lib/triangles/trianglePersoniba";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "10.08.1990";

  const canvas = drawTriangleBase(date);
  const buf = canvas.toBuffer("image/png");

  // ✅ Преобразуем Buffer → Uint8Array
  const arrayBuffer = new Uint8Array(buf);

  return new NextResponse(arrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
}
