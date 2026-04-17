import { NextRequest, NextResponse } from "next/server";

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

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  created_at: string;
}

// GET /api/feature-requests — list all, sorted by votes desc
export async function GET() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/feature_requests?select=id,title,description,votes,created_at&order=votes.desc,created_at.desc`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) {
      const text = await res.text();
      // If table doesn't exist, return empty rather than error
      if (text.includes("PGRST205") || text.includes("relation")) {
        return NextResponse.json({ requests: [], setup_needed: true });
      }
      console.error("feature_requests GET error:", text);
      return NextResponse.json({ requests: [] });
    }
    const requests: FeatureRequest[] = await res.json();
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("feature_requests GET exception:", err);
    return NextResponse.json({ requests: [] });
  }
}

// POST /api/feature-requests — create new request
export async function POST(req: NextRequest) {
  let title: string, description: string;

  try {
    const body = await req.json();
    title = (body.title ?? "").trim();
    description = (body.description ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!title || title.length < 3) {
    return NextResponse.json({ error: "Title must be at least 3 characters." }, { status: 400 });
  }
  if (title.length > 120) {
    return NextResponse.json({ error: "Title must be 120 characters or fewer." }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: "Description must be 500 characters or fewer." }, { status: 400 });
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/feature_requests`;
    const res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ title, description, votes: 1 }),
    });
    if (!res.ok) {
      const text = await res.text();
      if (text.includes("PGRST205") || text.includes("relation")) {
        return NextResponse.json({ error: "Feature requests are not yet set up. An admin needs to run the database migration." }, { status: 503 });
      }
      console.error("feature_requests POST error:", text);
      return NextResponse.json({ error: "Failed to save request." }, { status: 500 });
    }
    const rows: FeatureRequest[] = await res.json();
    return NextResponse.json({ request: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("feature_requests POST exception:", err);
    return NextResponse.json({ error: "Failed to save request." }, { status: 500 });
  }
}
