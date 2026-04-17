import { NextRequest, NextResponse } from 'next/server';
import { consumeMagicToken } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

async function getUserEmail(userId: string): Promise<string | null> {
  const url = `${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
  });
  if (!res.ok) return null;
  const rows: Array<{ email: string }> = await res.json();
  return rows[0]?.email ?? null;
}

// POST — called by the client-side callback page (immune to email scanner consumption)
export async function POST(req: NextRequest) {
  let token: string;
  try {
    const body = await req.json();
    token = (body.token ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  if (!token) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const userId = await consumeMagicToken(token);
  if (!userId) return NextResponse.json({ error: 'expired' }, { status: 401 });

  const email = await getUserEmail(userId);
  if (!email) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const jwt = signToken(email);

  const response = NextResponse.json({ ok: true, redirect: '/tool' });
  response.cookies.set('icebreak_session', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}

// GET — kept for backwards compatibility but no longer used for new links
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/login?error=expired', req.url));
}
