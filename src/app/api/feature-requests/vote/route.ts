import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function baseHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Prefer: "return=representation",
  };
}

// POST /api/feature-requests/vote — upvote a request by id
export async function POST(req: NextRequest) {
  let id: string;
  try {
    const body = await req.json();
    id = (body.id ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  try {
    // Fetch current votes
    const getUrl = `${SUPABASE_URL}/rest/v1/feature_requests?id=eq.${encodeURIComponent(id)}&select=id,votes&limit=1`;
    const getRes = await fetch(getUrl, { headers: baseHeaders() });
    if (!getRes.ok) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const rows: Array<{ id: string; votes: number }> = await getRes.json();
    if (!rows.length) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const newVotes = rows[0].votes + 1;

    // Increment
    const patchUrl = `${SUPABASE_URL}/rest/v1/feature_requests?id=eq.${encodeURIComponent(id)}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: baseHeaders(),
      body: JSON.stringify({ votes: newVotes }),
    });
    if (!patchRes.ok) {
      return NextResponse.json({ error: "Failed to record vote." }, { status: 500 });
    }
    const updated: Array<{ id: string; votes: number }> = await patchRes.json();
    return NextResponse.json({ votes: updated[0]?.votes ?? newVotes });
  } catch (err) {
    console.error("vote POST exception:", err);
    return NextResponse.json({ error: "Failed to record vote." }, { status: 500 });
  }
}
