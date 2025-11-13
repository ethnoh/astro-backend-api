// app/api/star/route.ts
import "@/lib/registerFont";
import { NextRequest } from "next/server";
import { renderStarSvg } from "@/lib/starRender";   // если алиасы не работают — замени на "../../../lib/starRender"
import { calcStarNumbers } from "@/lib/starMath";   // или "../../../lib/starMath"
import { PDFDocument } from "pdf-lib";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const format = (searchParams.get("format") || "png").toLowerCase();
  const date = searchParams.get("date") || "01.01.1990";

  // главное: режим рендера
  const mode = (searchParams.get("mode") as "clean" | "guide" | "minimal" | "full") || "minimal";

  // можно передать готовые числа через ?numbers=... (для тестов)
  const raw = searchParams.get("numbers");
  let numbers: any;
  if (raw) {
    try { numbers = JSON.parse(raw); }
    catch { numbers = JSON.parse(decodeURIComponent(raw)); }
  } else {
    numbers = calcStarNumbers(date);
  }

  // строим SVG
  const svg = renderStarSvg(numbers, { width: 1200, height: 1000 });


  // SVG -> PNG через sharp
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer(); // Buffer
  const pngU8 = new Uint8Array(pngBuffer); // Uint8Array

  // helper: делаем ReadableStream из Uint8Array (совместимо с Response BodyInit)
  const streamFrom = (u8: Uint8Array) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(u8);
        controller.close();
      },
    });

  if (format === "pdf") {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([1200, 1000]);
    const img = await pdf.embedPng(pngU8);
    page.drawImage(img, { x: 0, y: 0, width: 1200, height: 1000 });
    const bytes = await pdf.save();

    return new Response(streamFrom(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="star-${date}.pdf"`,
      },
    });
  }

  // PNG по умолчанию
  return new Response(streamFrom(pngU8), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="star-${date}.png"`,
    },
  });
}
