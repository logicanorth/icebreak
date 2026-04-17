import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUser, upsertUser, createMagicToken } from "@/lib/supabase";
import { sendMagicLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  // Get or create user — free users can always get a magic link
  let user = await getUser(email);
  if (!user) {
    user = await upsertUser(email, null, null, "free");
  }

  // Generate token and send magic link
  const rawToken = crypto.randomBytes(32).toString("hex");
  await createMagicToken(user.id, rawToken);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://icebreakemail.com";
  const magicUrl = `${baseUrl}/auth/callback?token=${rawToken}`;

  await sendMagicLink(email, magicUrl);

  return NextResponse.json({ ok: true });
}
