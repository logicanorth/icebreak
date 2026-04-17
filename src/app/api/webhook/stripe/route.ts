import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import crypto from "crypto";
import { upsertUser, updateSubscriptionStatus, createMagicToken } from "@/lib/supabase";
import { sendMagicLink } from "@/lib/email";

function verifyStripeSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));
    if (!tPart || !v1Part) return false;
    const t = tPart.slice(2);
    const v1 = v1Part.slice(3);
    const signed = `${t}.${rawBody}`;
    const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = JSON.parse(rawBody) as Stripe.Event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email ?? session.customer_details?.email;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!email) {
        console.error("checkout.session.completed: no email found", session.id);
        return NextResponse.json({ received: true });
      }

      // Upsert user with active status
      const user = await upsertUser(email, customerId, subscriptionId, "active");

      // Generate 32-byte hex magic token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Store magic token (15-min expiry)
      await createMagicToken(user.id, rawToken);

      // Build magic link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://icebreakemail.com";
      const magicUrl = `${baseUrl}/auth/callback?token=${rawToken}`;

      // Send magic link email
      await sendMagicLink(email, magicUrl);

      // Fire subscription_start analytics event
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://icebreakemail.com";
        await fetch(`${baseUrl}/api/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "subscription_start", email, session_id: session.id }),
        });
      } catch {
        // Non-fatal
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "inactive";
      await updateSubscriptionStatus(customerId, status);
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await updateSubscriptionStatus(customerId, "canceled");
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
