import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const date = searchParams.get("date");       // DD.MM.YYYY
    const year = searchParams.get("year");       // YYYY
    const email = searchParams.get("email");     // recipient

    // === VALIDATION ===
    if (!date || !year || !email) {
      return NextResponse.json(
        { error: "Missing required params: date, year, email" },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), "make_forecast_pdf_full.py");

    console.log(
      "DEBUG Railway SENDGRID KEY:",
      process.env.SENDGRID_API_KEY?.slice(0, 10)
    );

    // === RUN PYTHON SCRIPT ===
    // python make_forecast_pdf_full.py <date> <year> <email>
    const py = spawn("python3", [scriptPath, date, year, email]);

    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (errorOutput += data.toString()));

    const result = await new Promise((resolve) => {
      py.on("close", () => resolve(output || errorOutput));
    });

    // === DOWNLOAD MODE ===
    if (searchParams.get("download") === "1") {
      try {
        const birth = date.replace(/\./g, "");
        const pdfPath = `/tmp/GADA_PROGNOZE_${birth}_${year}.pdf`;
        const fileBuffer = fs.readFileSync(pdfPath);

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="GADA_PROGNOZE_${birth}_${year}.pdf"`,
          },
        });
      } catch (err) {
        console.error("Download error:", err);
      }
    }

    // === NORMAL JSON RESPONSE ===
    return NextResponse.json({
      status: "ok",
      message: "PDF generated and email sent (if python succeeded)",
      python_output: result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || e?.toString() },
      { status: 500 }
    );
  }
}
