import "@/lib/registerFont";
import { NextRequest, NextResponse } from "next/server";
import { drawNumbersMisija } from "@/lib/triangles/numbersMisija";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "10.08.1990";
  const bg = searchParams.get("bg") || undefined; // можно передать ?bg=public/images/xxx.jpg или URL

  try {
    const canvas = await drawNumbersMisija(date, bg);
    const buf = canvas.toBuffer("image/png");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err: any) {
    console.error("NumbersMisija render error:", err);
    return NextResponse.json(
      { error: "Failed to render NumbersMisija", details: err.message },
      { status: 500 }
    );
  }
}
