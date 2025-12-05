import { NextResponse } from "next/server";
import Stripe from "stripe";

// --- FIX: Lazy Stripe initialization (prevents build-time crash) ---
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(key);
}

// PRICE IDs FROM STRIPE
const PRICE_IDS: Record<string, string> = {
  personiba: "price_1Sal2V1fdzgcv7kkUxNrLTsy",
  finanses: "price_1Sal721fdzgcv7kkM3NjtPzn",
  berns: "price_1Sal7O1fdzgcv7kkWMPW6nRA",
  saderiba: "price_1Sal7b1fdzgcv7kkbk0bOb14",
  gada: "price_1Sal7r1fdzgcv7kkz0xrAGPq",
};

export async function POST(req: Request) {
  try {
    const stripe = getStripe(); // FIX: initialize here, not at import time

    const body = await req.json();
    const { report, date, partner, email, year } = body;

    if (!report || !PRICE_IDS[report]) {
      return NextResponse.json(
        { error: "Unknown report type" },
        { status: 400 }
      );
    }

    // Metadata passed into webhook for further PDF generation
    const metadata: Record<string, string> = {
      report,
    };
    if (date) metadata.date = date;
    if (partner) metadata.partner = partner;
    if (email) metadata.email = email;
    if (year) metadata.year = String(year);

    // Stripe redirect URLs
    const successUrl = `https://parnumerologiju.lv/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `https://parnumerologiju.lv/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[report],
          quantity: 1,
        },
      ],
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
