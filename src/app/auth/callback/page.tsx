'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      router.replace('/login?error=expired');
      return;
    }
    // POST to consume the token — scanners only follow GET links, not POST requests
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          router.replace(data.redirect ?? '/tool');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token, router]);

  if (status === 'error') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link expired</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            This login link has already been used or expired. Request a new one.
          </p>
          <a href='/login' style={{
            display: 'inline-block', background: 'var(--accent)', color: '#fff',
            padding: '11px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none'
          }}>
            Get a new link
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>Signing you in…</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
