import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scriptPath = path.join(process.cwd(), "make_saderiba_pdf.py");

    const py = spawn("python3", [scriptPath, JSON.stringify(body)]);

    let output = "";
    py.stdout.on("data", (data) => (output += data.toString()));

    let errorOutput = "";
    py.stderr.on("data", (data) => (errorOutput += data.toString()));

    const result = await new Promise((resolve) => {
      py.on("close", () => resolve(output || errorOutput));
    });

    return NextResponse.json({ status: "ok", result });
  } catch (e) {
    return NextResponse.json({ error: e?.toString() }, { status: 500 });
  }
}
