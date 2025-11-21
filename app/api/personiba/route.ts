import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const date = searchParams.get("date");
    const email = searchParams.get("email");

    if (!date || !email) {
      return NextResponse.json(
        { error: "Missing required params: date, email" },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), "make_personiba_pdf.py");

    // запускаем python3 make_personiba_pdf.py date email
    const py = spawn("python3", [scriptPath, date, email]);

    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (errorOutput += data.toString()));

    const result = await new Promise((resolve) => {
      py.on("close", () => resolve(output || errorOutput));
    });

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
