import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSessionEmail } from "@/lib/auth";
import { getUser } from "@/lib/supabase";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

interface BulkRow {
  prospectName: string;
  prospectTitle: string;
  companyUrl: string;
  yourOffer: string;
  tone?: "professional" | "casual" | "direct";
}

interface BulkResult {
  prospectName: string;
  companyUrl: string;
  subject: string;
  body: string;
  openingLineNote: string;
  error?: string;
}

async function fetchCompanyContext(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Icebreak/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOne(row: BulkRow): Promise<BulkResult> {
  const { prospectName, prospectTitle, companyUrl, yourOffer, tone = "professional" } = row;

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

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [{ role: "user", content: userMessage }],
    system: systemPrompt,
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  const parsed = JSON.parse(match[0]);

  return {
    prospectName,
    companyUrl,
    subject: parsed.subject,
    body: parsed.body,
    openingLineNote: parsed.openingLineNote,
  };
}

export async function POST(req: NextRequest) {
  // Verify Pro session
  const email = getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const user = await getUser(email);
  if (!user || user.subscription_status !== "active") {
    return NextResponse.json({ error: "Pro subscription required." }, { status: 403 });
  }

  let rows: BulkRow[];
  try {
    const body = await req.json();
    rows = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "rows must be a non-empty array." }, { status: 400 });
    }
    if (rows.length > 50) {
      return NextResponse.json({ error: "Maximum 50 rows per request." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const results: BulkResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i > 0) {
      await sleep(300);
    }
    try {
      const result = await generateOne(row);
      results.push(result);
    } catch (err) {
      results.push({
        prospectName: row.prospectName ?? "",
        companyUrl: row.companyUrl ?? "",
        subject: "",
        body: "",
        openingLineNote: "",
        error: err instanceof Error ? err.message : "Generation failed",
      });
    }
  }

  return NextResponse.json({ results });
}
