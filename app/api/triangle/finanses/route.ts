import { NextRequest, NextResponse } from "next/server";
import { drawTriangleFinanses } from "@/lib/triangles/triangleFinanses";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "10.08.1990";

  const canvas = drawTriangleFinanses(date);
  const buf = canvas.toBuffer("image/png");
  const arr = new Uint8Array(buf);

  return new NextResponse(arr, {
    headers: { "Content-Type": "image/png" },
  });
}
