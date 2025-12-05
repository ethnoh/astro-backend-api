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
  personiba: "price_1Sb1sg1RTgVwDdtK4iNjWBTl",
  finanses: "price_1Sb1vM1RTgVwDdtKAiBAFABj",
  berns: "price_1Sb1wP1RTgVwDdtK4b7HQmgs",
  saderiba: "price_1Sb1xW1RTgVwDdtKEbAbNMfz",
  gada: "price_1Sb1yG1RTgVwDdtKJp96j5CY",
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
