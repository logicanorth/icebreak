import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Idempotent migration — creates any missing tables
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SEED_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const migrations = [
    `CREATE TABLE IF NOT EXISTS feature_requests (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      description text DEFAULT '',
      votes integer DEFAULT 1,
      created_at timestamptz DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_feature_requests_votes ON feature_requests(votes DESC)`,
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      event text NOT NULL,
      properties jsonb DEFAULT '{}',
      ip text,
      occurred_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at DESC)`,
  ];

  const results: string[] = [];

  for (const sql of migrations) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    results.push(`${res.status}: ${text.substring(0, 100)}`);
  }

  return NextResponse.json({ results });
}
