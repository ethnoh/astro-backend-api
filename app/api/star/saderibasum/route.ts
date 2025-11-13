// app/api/star/saderibasum/route.ts
import "@/lib/registerFont";
import { NextRequest } from "next/server";
import { renderStarSvgSaderibaSum } from "@/lib/starRenderSaderibaSum";
import { calcStarNumbers } from "@/lib/starMath";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const format = (searchParams.get("format") || "png").toLowerCase();
  const dateA = searchParams.get("dateA") || "01.01.1990";
  const dateB = searchParams.get("dateB") || "01.01.1990";

  const you = calcStarNumbers(dateA);
  const partner = calcStarNumbers(dateB);

  // 📦 JSON режим (для Python)
  if (format === "json" || format === "numbers") {
    const sumOuter = {
      top: you.outer.top9 + partner.outer.top9,
      ml: you.outer.left1 + partner.outer.left1,
      mr: you.outer.right6 + partner.outer.right6,
      br: you.outer.br16 + partner.outer.br16,
      bl: you.outer.bl5 + partner.outer.bl5,
    };
    return new Response(JSON.stringify(sumOuter), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 📦 Обычный рендер SVG → PNG
  const svg = renderStarSvgSaderibaSum(you, partner, { width: 360, height: 360 });

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
    const page = pdf.addPage([360, 360]);
    const img = await pdf.embedPng(pngU8);
    page.drawImage(img, { x: 0, y: 0, width: 360, height: 360 });
    const bytes = await pdf.save();

    return new Response(streamFrom(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="star-saderiba-sum-${dateA}-${dateB}.pdf"`,
      },
    });
  }

  return new Response(streamFrom(pngU8), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="star-saderiba-sum-${dateA}-${dateB}.png"`,
    },
  });
}
