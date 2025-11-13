// app/api/star/berns/route.ts
import "@/lib/registerFont";
import { NextRequest } from "next/server";
import { renderStarSvgBerns } from "@/lib/starRenderBerns"; // 🔹 твой новый файл
import { calcStarNumbers } from "@/lib/starMath";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const format = (searchParams.get("format") || "png").toLowerCase();
  const date = searchParams.get("date") || "01.01.1990";

  // режим (оставим, если пригодится)
  const mode = (searchParams.get("mode") as "clean" | "guide" | "minimal" | "full") || "minimal";

  const raw = searchParams.get("numbers");
  let numbers: any;
  if (raw) {
    try { numbers = JSON.parse(raw); }
    catch { numbers = JSON.parse(decodeURIComponent(raw)); }
  } else {
    numbers = calcStarNumbers(date);
  }

  // ✅ используем новый SVG без фона
  const svg = renderStarSvgBerns(numbers, { width: 900, height: 900 });

  // SVG -> PNG через sharp
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const pngU8 = new Uint8Array(pngBuffer);

  const streamFrom = (u8: Uint8Array) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(u8);
        controller.close();
      },
    });

  if (format === "pdf") {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([900, 900]);
    const img = await pdf.embedPng(pngU8);
    page.drawImage(img, { x: 0, y: 0, width: 900, height: 900 });
    const bytes = await pdf.save();

    return new Response(streamFrom(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="star-berns-${date}.pdf"`,
      },
    });
  }

  // PNG по умолчанию
  return new Response(streamFrom(pngU8), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="star-berns-${date}.png"`,
    },
  });
}
