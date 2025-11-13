// app/api/star/saderiba/route.ts
import { NextRequest } from "next/server";
import { renderStarSvgSaderiba } from "@/lib/starRenderSaderiba";   // 🔹 новый бордовый вариант
import { calcStarNumbers } from "@/lib/starMath";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const format = (searchParams.get("format") || "png").toLowerCase();
  const date = searchParams.get("date") || "01.01.1990";

  const raw = searchParams.get("numbers");
  let numbers: any;

  // если числа переданы — парсим JSON, иначе считаем по дате
  if (raw) {
    try {
      numbers = JSON.parse(raw);
    } catch {
      numbers = JSON.parse(decodeURIComponent(raw));
    }
  } else {
    numbers = calcStarNumbers(date);
  }

  // ✅ новый SVG (бордовый стиль, прозрачный фон)
  const svg = renderStarSvgSaderiba(numbers, { width: 900, height: 900 });

  // SVG → PNG через sharp
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
        "Content-Disposition": `inline; filename="star-saderiba-${date}.pdf"`,
      },
    });
  }

  // PNG по умолчанию
  return new Response(streamFrom(pngU8), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="star-saderiba-${date}.png"`,
    },
  });
}
