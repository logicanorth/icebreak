const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Prefer: "return=representation",
  };
}

export interface UserRow {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  created_at: string;
}

export async function getUser(email: string): Promise<UserRow | null> {
  const url = `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  const rows: UserRow[] = await res.json();
  return rows[0] ?? null;
}

export async function upsertUser(
  email: string,
  stripeCustomerId: string | null,
  subscriptionId: string | null,
  status: string
): Promise<UserRow> {
  const url = `${SUPABASE_URL}/rest/v1/users`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      email,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: status,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upsertUser failed: ${text}`);
  }
  const rows: UserRow[] = await res.json();
  return rows[0];
}

export async function updateSubscriptionStatus(
  stripeCustomerId: string,
  status: string
): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/users?stripe_customer_id=eq.${encodeURIComponent(stripeCustomerId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ subscription_status: status }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`updateSubscriptionStatus failed: ${text}`);
  }
}

export async function createMagicToken(
  userId: string,
  token: string
): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/magic_tokens`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createMagicToken failed: ${text}`);
  }
}

export async function consumeMagicToken(token: string): Promise<string | null> {
  // Look up the token
  const lookupUrl = `${SUPABASE_URL}/rest/v1/magic_tokens?token=eq.${encodeURIComponent(token)}&used=eq.false&limit=1`;
  const lookupRes = await fetch(lookupUrl, { headers: headers() });
  if (!lookupRes.ok) return null;

  const rows: Array<{
    id: string;
    user_id: string;
    token: string;
    expires_at: string;
    used: boolean;
  }> = await lookupRes.json();

  if (!rows.length) return null;

  const row = rows[0];

  // Check expiry
  if (new Date(row.expires_at) < new Date()) return null;

  // Mark as used
  const markUrl = `${SUPABASE_URL}/rest/v1/magic_tokens?id=eq.${encodeURIComponent(row.id)}`;
  const markRes = await fetch(markUrl, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ used: true }),
  });
  if (!markRes.ok) return null;

  return row.user_id;
}
