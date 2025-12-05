import { NextResponse } from "next/server";
import Stripe from "stripe";
import { spawn } from "child_process";
import path from "path";

// REQUIRED for raw body handling in App Router
export const runtime = "nodejs";
export const preferredRegion = "fra1"; // or remove if not needed

// --- Stripe lazy init ---
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

// --- Helper: raw bytes ---
async function readRawBody(req: Request): Promise<Buffer> {
  const ab = await req.arrayBuffer();
  return Buffer.from(ab);
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const rawBody = await readRawBody(req);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature" },
        { status: 400 }
      );
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    // Verify event
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: any) {
      console.error("❌ Invalid Stripe signature:", err.message);
      return NextResponse.json(
        { error: `Webhook signature error: ${err.message}` },
        { status: 400 }
      );
    }

    // --- MAIN EVENT ---
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log("🔥 Payment completed:", metadata);

      const { report, date, partner, email, year } = metadata;

      const scriptMap: Record<string, string> = {
        personiba: "make_personiba_pdf.py",
        finanses: "make_finanses_pdf.py",
        berns: "make_berns_pdf.py",
        saderiba: "make_saderiba_pdf.py",
        gada: "make_forecast_pdf_full.py",
      };

      const scriptName = scriptMap[report];
      if (scriptName) {
        const scriptPath = path.join(process.cwd(), scriptName);

        console.log("▶️ Running python:", scriptPath);

        const py = spawn("python3", [
          scriptPath,
          JSON.stringify({ date, partner, email, year }),
        ]);

        py.stdout.on("data", (d) => console.log("PYTHON:", d.toString()));
        py.stderr.on("data", (d) => console.error("PY ERR:", d.toString()));
        py.on("close", (code) =>
          console.log("🐍 Python finished with code:", code)
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("🔥 Webhook fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
