import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getUser } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);

  if (!email) {
    return NextResponse.json({ isPro: false, email: null });
  }

  const user = await getUser(email);

  if (!user) {
    return NextResponse.json({ isPro: false, email });
  }

  const isPro = user.subscription_status === "active";
  return NextResponse.json({ isPro, email });
}
