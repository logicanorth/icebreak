import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken, getUser } from "@/lib/supabase";
import { signToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const userId = await consumeMagicToken(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  // Fetch the user to get their email
  const userUrl = `${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&limit=1`;
  const userRes = await fetch(userUrl, {
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const users: Array<{ email: string }> = await userRes.json();
  if (!users.length) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const email = users[0].email;
  const jwt = signToken(email);

  const response = NextResponse.redirect(new URL("/tool", req.url));
  response.cookies.set("icebreak_session", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
