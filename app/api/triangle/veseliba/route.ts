import { NextRequest, NextResponse } from "next/server";
import { drawTriangleVeseliba } from "@/lib/triangles/triangleVeseliba";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "10.08.1990";

  try {
    const canvas = drawTriangleVeseliba(date);
    const buf = canvas.toBuffer("image/png");
    const arr = new Uint8Array(buf);

    return new NextResponse(arr, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err: any) {
    console.error("Veseliba render error:", err);
    return NextResponse.json(
      { error: "Failed to render Veseliba triangle", details: err.message },
      { status: 500 }
    );
  }
}
