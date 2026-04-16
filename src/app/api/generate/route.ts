import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchCompanyContext(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Icebreak/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip tags, collapse whitespace, cap at 3000 chars
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prospectName, prospectTitle, companyUrl, yourOffer, tone } = await req.json();

    if (!prospectName || !companyUrl || !yourOffer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const companyContext = await fetchCompanyContext(companyUrl);

    const toneInstruction =
      tone === "casual"
        ? "Write in a casual, friendly tone — conversational but still professional."
        : tone === "direct"
        ? "Write in a direct, no-fluff tone. Short sentences. Get to the point fast."
        : "Write in a professional, polished tone.";

    const prompt = `You are an expert B2B cold email writer. Write a personalized cold email based on the information below.

PROSPECT:
- Name: ${prospectName}
- Title: ${prospectTitle || "unknown"}
- Company URL: ${companyUrl}

COMPANY CONTEXT (from their website):
${companyContext || "No website content available — use the company URL domain for context."}

SENDER'S OFFER:
${yourOffer}

TONE: ${toneInstruction}

Write a cold email with:
1. A compelling, specific subject line (not generic)
2. An opening line that references something specific about their company (not "I came across your website")
3. A value proposition tied directly to their apparent business situation
4. A simple, low-friction CTA

Respond ONLY with valid JSON in this exact format:
{
  "subject": "...",
  "body": "...",
  "openingLineNote": "Brief explanation of why the opening line is personalized and effective (1-2 sentences)"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
