import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSessionEmail } from "@/lib/auth";
import { getUser } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
  const email = getSessionEmail(req);

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await getUser(email);

  if (!user || !user.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer found." }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://icebreakemail.com";

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${baseUrl}/tool`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json({ error: "Failed to create portal session." }, { status: 500 });
  }
}
