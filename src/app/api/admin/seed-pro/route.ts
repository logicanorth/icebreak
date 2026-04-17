import { NextRequest, NextResponse } from "next/server";
import { upsertUser, createMagicToken } from "@/lib/supabase";
import { sendMagicLink } from "@/lib/email";
import crypto from "crypto";

// One-time admin endpoint — creates a Pro test account and sends magic link
// Protected by ADMIN_SEED_SECRET env var (set to a random value before deploying)
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SEED_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Create/update user as Pro
  const user = await upsertUser(
    email,
    "cus_test_admin_seed",
    "sub_test_admin_seed",
    "active"
  );

  if (!user) {
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }

  // Generate magic token
  const token = crypto.randomBytes(32).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://icebreak-silk.vercel.app";
  const magicUrl = `${baseUrl}/auth/callback?token=${token}`;

  await createMagicToken(user.id, token);
  await sendMagicLink(email, magicUrl);

  return NextResponse.json({ ok: true, email, magicUrl });
}
