import { NextResponse } from "next/server";
import Stripe from "stripe";
import { spawn } from "child_process";
import path from "path";

// Needed for raw body handling in Next.js App Router
export const runtime = "nodejs";
export const preferredRegion = "fra1";

// ---- INIT STRIPE ----
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

// ---- RAW BODY HELPER ----
async function readRawBody(req: Request): Promise<Buffer> {
  const ab = await req.arrayBuffer();
  return Buffer.from(ab);
}

// =========================================================
//                       MAIN POST HANDLER
// =========================================================
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

    // ==========================
    //    Verify Stripe Event
    // ==========================
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

    // =========================================================
    //               HANDLE CHECKOUT COMPLETED
    // =========================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const metadata = session.metadata || {};

      console.log("🔥 Checkout completed, metadata:", metadata);

      const report = metadata.report;
      const date = metadata.date;
      const partner = metadata.partner || "";
      const email = metadata.email;
      const year = metadata.year;

      if (!report || !date || !email) {
        console.error("❌ Missing required metadata fields");
        return NextResponse.json({ received: true });
      }

      // Map report → python file
      const scriptMap: Record<string, string> = {
        personiba: "make_personiba_pdf.py",
        finanses: "make_finanses_pdf.py",
        berns: "make_berns_pdf.py",
        saderiba: "make_saderiba_pdf.py",
        gada: "make_forecast_pdf_full.py",
      };

      const scriptName = scriptMap[report];
      if (!scriptName) {
        console.error("❌ Unknown report type:", report);
        return NextResponse.json({ received: true });
      }

      const scriptPath = path.join(process.cwd(), scriptName);

      console.log("▶️ Selected script:", scriptName);
      console.log("▶️ Full path:", scriptPath);

      // Build Python arguments correctly
      let args: string[] = [];

      switch (report) {
        case "gada":
          // make_forecast_pdf_full.py DD.MM.YYYY YEAR EMAIL
          args = [date, year, email];
          break;

        case "saderiba":
          // make_saderiba_pdf.py DATE1 DATE2 EMAIL
          args = [date, partner, email];
          break;

        default:
          // personiba / finanses / berns
          // python script DATE EMAIL
          args = [date, email];
      }

      console.log("▶️ Python args:", args);

      // Spawn Python
      const py = spawn("python3", [scriptPath, ...args]);

      py.stdout.on("data", (d) => console.log("🐍 PYTHON:", d.toString()));
      py.stderr.on("data", (d) => console.error("🐍 PY ERR:", d.toString()));
      py.on("close", (code) =>
        console.log("🐍 Python finished with exit code:", code)
      );
    }

    // ACK to Stripe
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("🔥 FATAL webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
