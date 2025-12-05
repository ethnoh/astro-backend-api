import { NextResponse } from "next/server";
import Stripe from "stripe";
import { spawn } from "child_process";
import path from "path";

// Required config for App Router (instead of deprecated export const config)
export const runtime = "nodejs";
export const preferredRegion = "fra1";

// Lazy Stripe init
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  return new Stripe(key);
}

// Helper: raw body for Stripe signature check
async function readRawBody(req: Request): Promise<Buffer> {
  const array = await req.arrayBuffer();
  return Buffer.from(array);
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const rawBody = await readRawBody(req);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err: any) {
      console.error("❌ Webhook signature error:", err);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const metadata = session.metadata || {};
      console.log("🔥 Payment completed:", metadata);

      const { report, date, partner, email, year } = metadata;

      // Map reports to Python scripts
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

        const args = [
          JSON.stringify({
            date,
            partner,
            email,
            year,
          }),
        ];

        console.log("▶️ Running python:", scriptPath);

        const py = spawn("python3", [scriptPath, ...args]);

        py.stdout.on("data", (d) => console.log("PYTHON:", d.toString()));
        py.stderr.on("data", (d) => console.error("PYTHON ERROR:", d.toString()));
        py.on("close", (code) => console.log("Python finished with code:", code));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
