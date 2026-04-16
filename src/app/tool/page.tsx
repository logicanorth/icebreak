"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const FREE_LIMIT = 5;
const STORAGE_KEY = "icebreak_usage";

interface Usage {
  date: string;
  count: number;
}

interface EmailResult {
  subject: string;
  body: string;
  openingLineNote: string;
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getUsage(): Usage {
  if (typeof window === "undefined") return { date: getTodayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayKey(), count: 0 };
    const parsed: Usage = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return { date: getTodayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

function incrementUsage() {
  const usage = getUsage();
  const next = { ...usage, count: usage.count + 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export default function ToolPage() {
  const [form, setForm] = useState({
    prospectName: "",
    prospectTitle: "",
    companyUrl: "",
    yourOffer: "",
    tone: "professional" as "professional" | "casual" | "direct",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [error, setError] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null);

  useEffect(() => {
    setUsageCount(getUsage().count);
  }, []);

  const remaining = FREE_LIMIT - usageCount;
  const isLimitReached = remaining <= 0;

  const handleGenerate = async () => {
    if (!form.prospectName || !form.companyUrl || !form.yourOffer) {
      setError("Please fill in name, company URL, and your offer.");
      return;
    }
    if (isLimitReached) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      const updated = incrementUsage();
      setUsageCount(updated.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (type: "subject" | "body" | "all") => {
    if (!result) return;
    let text = "";
    if (type === "subject") text = result.subject;
    else if (type === "body") text = result.body;
    else text = `Subject: ${result.subject}\n\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px", borderBottom: "1px solid var(--border)",
        background: "var(--bg)"
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", textDecoration: "none" }}>
          icebreak
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: remaining <= 1 ? "#f59e0b" : "var(--muted)" }}>
            {isLimitReached ? "Daily limit reached" : `${remaining} free email${remaining !== 1 ? "s" : ""} left today`}
          </span>
          <Link href="/?upgrade=1#pricing" style={{
            background: "var(--accent)", color: "#fff", padding: "7px 16px",
            borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: "none"
          }}>
            Upgrade — $29/mo
          </Link>
        </div>
      </nav>

      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 0, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "32px 24px"
      }}>
        {/* Left: Input */}
        <div style={{ paddingRight: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>
            Generate cold email
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>
            Fill in the details below. We read their website and personalize every email.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Prospect name</label>
                <input
                  className="input"
                  placeholder="Alex Kim"
                  value={form.prospectName}
                  onChange={(e) => setForm({ ...form, prospectName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Their title</label>
                <input
                  className="input"
                  placeholder="Head of Growth"
                  value={form.prospectTitle}
                  onChange={(e) => setForm({ ...form, prospectTitle: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Company website URL</label>
              <input
                className="input"
                placeholder="acmecorp.com"
                value={form.companyUrl}
                onChange={(e) => setForm({ ...form, companyUrl: e.target.value })}
              />
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>
                We fetch their site to personalize the email. LinkedIn URLs won't work.
              </p>
            </div>

            <div>
              <label className="label">Your offer (1 sentence)</label>
              <textarea
                className="input"
                placeholder="We help SaaS companies reduce churn by 30% with automated onboarding sequences."
                value={form.yourOffer}
                onChange={(e) => setForm({ ...form, yourOffer: e.target.value })}
                style={{ resize: "vertical", minHeight: 80 }}
              />
            </div>

            <div>
              <label className="label">Tone</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["professional", "casual", "direct"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tone: t })}
                    style={{
                      padding: "8px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500,
                      border: form.tone === t ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: form.tone === t
                        ? "color-mix(in oklab, var(--accent) 15%, transparent)"
                        : "var(--surface)",
                      color: form.tone === t ? "#a5b4fc" : "var(--muted)",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                background: "color-mix(in oklab, #ef4444 12%, transparent)",
                border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5"
              }}>
                {error}
              </div>
            )}

            {isLimitReached ? (
              <div style={{
                background: "color-mix(in oklab, #f59e0b 10%, transparent)",
                border: "1px solid color-mix(in oklab, #f59e0b 25%, transparent)",
                borderRadius: 8, padding: "16px", textAlign: "center"
              }}>
                <p style={{ fontSize: 14, color: "#fcd34d", marginBottom: 12 }}>
                  You've used all 5 free emails for today.
                </p>
                <Link href="/?upgrade=1#pricing" className="btn-primary" style={{ textDecoration: "none" }}>
                  Upgrade to Pro — $29/mo
                </Link>
              </div>
            ) : (
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={loading || !form.prospectName || !form.companyUrl || !form.yourOffer}
                style={{ alignSelf: "flex-start", minWidth: 200 }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block"
                    }} />
                    Personalizing...
                  </>
                ) : (
                  "Generate email"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Output */}
        <div style={{
          paddingLeft: 32, borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column"
        }}>
          {!result && !loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "var(--muted)", textAlign: "center", gap: 12
            }}>
              <div style={{ fontSize: 40 }}>✉</div>
              <p style={{ fontSize: 15, maxWidth: 280, lineHeight: 1.6 }}>
                Your personalized email will appear here. Takes about 10 seconds.
              </p>
            </div>
          )}

          {loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                animation: "spin 0.8s linear infinite"
              }} />
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Reading their website and writing your email...
              </p>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Your email</h2>
                <button
                  onClick={() => copy("all")}
                  style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 500,
                    color: copied === "all" ? "var(--success)" : "var(--text)",
                    cursor: "pointer"
                  }}
                >
                  {copied === "all" ? "Copied!" : "Copy all"}
                </button>
              </div>

              {/* Subject */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span className="label" style={{ margin: 0 }}>Subject line</span>
                  <button
                    onClick={() => copy("subject")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: copied === "subject" ? "var(--success)" : "var(--muted)",
                      padding: "0 4px"
                    }}
                  >
                    {copied === "subject" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{result.subject}</p>
              </div>

              {/* Body */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span className="label" style={{ margin: 0 }}>Email body</span>
                  <button
                    onClick={() => copy("body")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: copied === "body" ? "var(--success)" : "var(--muted)",
                      padding: "0 4px"
                    }}
                  >
                    {copied === "body" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{
                  fontSize: 14, color: "var(--text)", lineHeight: 1.7,
                  whiteSpace: "pre-wrap"
                }}>
                  {result.body}
                </p>
              </div>

              {/* Why this works */}
              <div style={{
                background: "color-mix(in oklab, var(--accent) 8%, transparent)",
                border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
                borderRadius: 8, padding: "12px 16px"
              }}>
                <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>WHY THIS OPENER WORKS</span>
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
                  {result.openingLineNote}
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || isLimitReached}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 500,
                  color: "var(--muted)", cursor: "pointer", width: "100%"
                }}
              >
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
