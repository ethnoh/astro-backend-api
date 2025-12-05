import { NextResponse } from "next/server";
import Stripe from "stripe";
import { spawn } from "child_process";
import path from "path";

// Lazy init Stripe to avoid build-time crash
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  return new Stripe(key);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body (Stripe requires it)
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
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      console.error("❌ Webhook signature error:", err);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle only checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const metadata = session.metadata || {};
      const report = metadata.report;
      const date = metadata.date;
      const partner = metadata.partner;
      const email = metadata.email;
      const year = metadata.year;

      console.log("🔥 Payment success, generating PDF:", metadata);

      // Pick correct python script
      const scriptMap: Record<string, string> = {
        personiba: "make_personiba_pdf.py",
        finanses: "make_finanses_pdf.py",
        berns: "make_berns_pdf.py",
        saderiba: "make_saderiba_pdf.py",
        gada: "make_forecast_pdf_full.py",
      };

      const scriptName = scriptMap[report];
      if (!scriptName) {
        console.error("Unknown report:", report);
        return NextResponse.json({ status: "ignored" });
      }

      const scriptPath = path.join(process.cwd(), scriptName);

      // Build args for python
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
      py.stderr.on("data", (d) => console.error("PYTHON ERR:", d.toString()));

      py.on("close", (code) => console.log("Python finished:", code));
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
