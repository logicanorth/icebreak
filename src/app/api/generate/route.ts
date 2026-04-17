import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSessionEmail } from "@/lib/auth";
import { getUser } from "@/lib/supabase";

const FREE_DAILY_LIMIT = 5;

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

interface GenerateRequest {
  prospectName: string;
  prospectTitle: string;
  companyUrl: string;
  yourOffer: string;
  tone?: "professional" | "casual" | "direct";
}

async function fetchCompanyContext(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Icebreak/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();
    // Strip tags and collapse whitespace, keep first 3000 chars
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    return text;
  } catch {
    return "";
  }
}

async function getIPUsageToday(ip: string): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `${process.env.SUPABASE_URL}/rest/v1/free_usage?ip=eq.${encodeURIComponent(ip)}&date=eq.${today}&select=count&limit=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    });
    if (!res.ok) return 0;
    const rows: Array<{ count: number }> = await res.json();
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function incrementIPUsage(ip: string): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `${process.env.SUPABASE_URL}/rest/v1/free_usage`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ ip, date: today, count: 1 }),
    });
  } catch {
    // Non-fatal — don't block the request if tracking fails
  }
}

async function upsertIPUsage(ip: string): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];
    // Use an RPC-style upsert: increment count if row exists, insert with count=1 if not
    const url = `${process.env.SUPABASE_URL}/rest/v1/free_usage`;
    // First try to get current count
    const current = await getIPUsageToday(ip);
    if (current >= FREE_DAILY_LIMIT) return current;

    // Increment via upsert
    const newCount = current + 1;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ ip, date: today, count: newCount }),
    });
    return newCount;
  } catch {
    return 0;
  }
}

export async function POST(req: NextRequest) {
  // Determine if this is a Pro user via session cookie
  const sessionEmail = getSessionEmail(req);
  let isProUser = false;
  if (sessionEmail) {
    const user = await getUser(sessionEmail);
    isProUser = user?.subscription_status === "active";
  }

  // Server-side rate limiting for free users
  if (!isProUser) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const usageToday = await getIPUsageToday(ip);
    if (usageToday >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily free limit reached. Upgrade to Pro for unlimited emails.", limitReached: true },
        { status: 429 }
      );
    }
  }

  const body = (await req.json()) as GenerateRequest;
  const { prospectName, prospectTitle, companyUrl, yourOffer, tone = "professional" } = body;

  if (!prospectName || !companyUrl || !yourOffer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const companyContext = await fetchCompanyContext(companyUrl);

  const toneGuide = {
    professional: "Formal, polished, concise. No slang.",
    casual: "Warm and conversational, like a message from someone they might know. Friendly but not sloppy.",
    direct: "Short, punchy, no fluff. Get to the point in 3 sentences max.",
  }[tone];

  const systemPrompt = `You are an expert cold email writer who specializes in hyper-personalized outbound.
Your emails have above-average reply rates because they feel genuinely researched, not templated.
Tone guidance: ${toneGuide}

Rules:
- Never use "I hope this email finds you well" or any cliche opener
- The subject line must be specific to their company or role — not generic
- The first sentence must reference something real about their company or work
- Keep the email under 120 words (body only, not counting subject)
- End with a soft, single CTA (e.g., "worth a 15-min call?" — not "I'd love to hop on a call")
- Do NOT use buzzwords: synergy, leverage, solutions, game-changing, revolutionary
- Output exactly this JSON structure, nothing else:
{
  "subject": "...",
  "body": "...",
  "openingLineNote": "one sentence explaining why the opener is specific/personalized"
}`;

  const userMessage = `Prospect: ${prospectName}, ${prospectTitle}
Company URL: ${companyUrl}
${companyContext ? `Company website excerpt:\n${companyContext}\n` : ""}
What I'm selling: ${yourOffer}

Write a personalized cold email to ${prospectName}.`;

  try {
    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    // Extract JSON safely
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]);

    // Track usage for free users only after successful generation
    if (!isProUser) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "unknown";
      await upsertIPUsage(ip);
    }

    return NextResponse.json({
      subject: parsed.subject,
      body: parsed.body,
      openingLineNote: parsed.openingLineNote,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
