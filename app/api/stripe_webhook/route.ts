import { NextResponse } from "next/server";
import Stripe from "stripe";
import { execFile } from "child_process";
import path from "path";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// IMPORTANT: this must match the “Signing secret” from Stripe dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // We only care about completed checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const metadata = session.metadata ?? {};
    const report = metadata.report;
    const date = metadata.date;
    const partner = metadata.partner ?? "";
    const email = metadata.email;
    const year = metadata.year ?? "";

    console.log("🎯 Received purchase:", metadata);

    // Select correct python script
    let scriptName = "";
    switch (report) {
      case "personiba":
        scriptName = "make_personiba_pdf.py";
        break;
      case "finanses":
        scriptName = "make_finanses_pdf.py";
        break;
      case "berns":
        scriptName = "make_berns_pdf.py";
        break;
      case "saderiba":
        scriptName = "make_saderiba_pdf.py";
        break;
      case "gada":
        scriptName = "make_forecast_pdf_full.py";
        break;
      default:
        return NextResponse.json(
          { error: "Unknown report type" },
          { status: 400 }
        );
    }

    const scriptPath = path.join(process.cwd(), scriptName);

    const args = [
      JSON.stringify({
        date,
        partner,
        email,
        year,
      }),
    ];

    console.log("🚀 Running:", scriptName);

    const result = await new Promise((resolve, reject) => {
      execFile("python3", [scriptPath, ...args], (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Python script failed:", stderr);
          reject(err);
          return;
        }
        console.log("📄 Python output:", stdout);
        resolve(stdout);
      });
    });

    return NextResponse.json({ status: "ok", detail: "PDF generated & sent" });
  }

  return NextResponse.json({ received: true });
}
