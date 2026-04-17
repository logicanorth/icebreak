import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ALLOWED_EVENTS = new Set([
  "signup",
  "activation",
  "paywall_view",
  "upgrade_click",
  "subscription_start",
  "email_generated",
]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : null;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;

  // Store event in Supabase — non-blocking, best-effort
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event,
        properties: body,
        ip,
        occurred_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ ok: true });
}
