import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Icebreak Pro",
              description: "Unlimited AI cold email personalization",
            },
            unit_amount: 2900, // $29.00
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/tool?success=1`,
      cancel_url: `${origin}/tool`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
