"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ── Analytics helper ───────────────────────────────────────────────────────────
function track(event: string, props?: Record<string, string | number | boolean>) {
  try {
    // Fire-and-forget to our analytics endpoint
    const payload = { event, ...props, ts: Date.now() };
    navigator.sendBeacon("/api/analytics", JSON.stringify(payload));
  } catch {
    // Never block user action due to analytics failure
  }
}

// ── Feature request types ──────────────────────────────────────────────────────
interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  created_at: string;
}

// ── Checkout ───────────────────────────────────────────────────────────────────
async function startCheckout() {
  const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
}

export default function LandingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Feature requests state
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [frTitle, setFrTitle] = useState("");
  const [frDesc, setFrDesc] = useState("");
  const [frStatus, setFrStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [frError, setFrError] = useState("");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [frOpen, setFrOpen] = useState(false);

  useEffect(() => {
    // Track page landing (signup intent event)
    track("signup", { page: "landing" });
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const res = await fetch("/api/feature-requests");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      // Silent fail — feature board is non-critical
    }
  }

  const handleGetPro = async () => {
    track("upgrade_click", { source: "pricing" });
    setCheckoutLoading(true);
    await startCheckout().finally(() => setCheckoutLoading(false));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frTitle.trim()) return;
    setFrStatus("loading");
    setFrError("");
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: frTitle.trim(), description: frDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFrError(data.error ?? "Failed to submit. Try again.");
        setFrStatus("error");
      } else {
        setFrStatus("success");
        setFrTitle("");
        setFrDesc("");
        setFrOpen(false);
        loadRequests();
      }
    } catch {
      setFrError("Network error. Please try again.");
      setFrStatus("error");
    }
  };

  const handleVote = async (id: string) => {
    if (votedIds.has(id)) return;
    // Optimistic update
    setVotedIds((prev) => new Set([...prev, id]));
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r))
    );
    try {
      await fetch("/api/feature-requests/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Revert optimistic update on failure
      setVotedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, votes: r.votes - 1 } : r))
      );
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, background: "var(--bg)", zIndex: 10
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>
          icebreak
        </span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#pricing" style={{ color: "var(--muted)", fontSize: 14, textDecoration: "none" }}>Pricing</a>
          <Link href="/login" style={{ color: "var(--muted)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          <Link href="/tool" style={{
            background: "var(--accent)", color: "#fff", padding: "8px 18px",
            borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none"
          }}
            onClick={() => track("activation", { source: "nav" })}
          >
            Try free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", padding: "80px 24px 60px"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "color-mix(in oklab, var(--accent) 15%, transparent)",
          border: "1px solid color-mix(in oklab, var(--accent) 30%, transparent)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 32,
          fontSize: 13, fontWeight: 500, color: "#a5b4fc"
        }}>
          Clay just raised prices to $495/mo. We did not.
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1.1,
          maxWidth: 760, marginBottom: 24
        }}>
          Personalized cold emails<br />
          <span style={{ color: "var(--accent)" }}>in 10 seconds flat</span>
        </h1>

        <p style={{
          fontSize: 18, color: "var(--muted)", maxWidth: 520,
          lineHeight: 1.6, marginBottom: 40
        }}>
          Paste a company URL and your offer. Icebreak reads their website
          and writes a hyper-personalized email — subject line, opener, and close.
          No workflow builder. No credit system. Just emails.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/tool" className="btn-primary" style={{ fontSize: 16, padding: "14px 32px", textDecoration: "none" }}
            onClick={() => track("activation", { source: "hero" })}
          >
            Generate your first email free
          </Link>
          <a href="#how" style={{
            color: "var(--muted)", fontSize: 15, padding: "14px 24px",
            border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none",
            fontWeight: 500
          }}>
            See how it works
          </a>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          5 free emails per day. No credit card required.
        </p>
      </section>

      {/* Stats */}
      <section style={{
        display: "flex", borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)", background: "var(--surface)"
      }}>
        {[
          { num: "10s", label: "average generation time" },
          { num: "$29/mo", label: "vs $495/mo for Clay Growth" },
          { num: "3 inputs", label: "name, URL, your pitch" },
        ].map((s, i) => (
          <div key={s.num} style={{
            flex: 1, padding: "28px 24px", textAlign: "center",
            borderRight: i < 2 ? "1px solid var(--border)" : undefined
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
              {s.num}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: 16 }}>
          How it works
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: "center", marginBottom: 56, letterSpacing: "-0.03em" }}>
          Three inputs. One great email.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[
            { step: "01", title: "Add prospect info", desc: "Name, title, and company website URL. That's all we need." },
            { step: "02", title: "Describe your offer", desc: "One sentence on what you sell and who it helps." },
            { step: "03", title: "Get the email", desc: "Subject line, personalized opener, value prop, and CTA — ready to copy." },
          ].map((s) => (
            <div key={s.step} className="card">
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 12 }}>{s.step}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: 16 }}>
          Pricing
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: "center", marginBottom: 48, letterSpacing: "-0.03em" }}>
          Simple. No credits.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Free</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em" }}>$0</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>forever</div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {["5 emails per day", "Full personalization", "Copy-ready output"].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "var(--muted)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>+</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/tool" style={{
              marginTop: "auto", textAlign: "center", padding: "11px 0",
              border: "1px solid var(--border)", borderRadius: 8, fontSize: 14,
              fontWeight: 600, color: "var(--text)", textDecoration: "none", display: "block"
            }}
              onClick={() => track("activation", { source: "free_plan" })}
            >
              Start free
            </Link>
          </div>

          <div className="card" style={{
            display: "flex", flexDirection: "column", gap: 16,
            border: "1px solid var(--accent)",
            background: "color-mix(in oklab, var(--accent) 6%, var(--surface))"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>Pro</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, background: "var(--accent)", color: "#fff",
                  borderRadius: 4, padding: "2px 7px"
                }}>MOST POPULAR</span>
              </div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em" }}>$29</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>per month</div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {["Unlimited emails per day", "All 3 tone modes", "Copy subject + body separately", "Bulk CSV upload (up to 50 at once)"].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "var(--muted)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>+</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={handleGetPro} disabled={checkoutLoading} className="btn-primary" style={{
              marginTop: "auto", justifyContent: "center", width: "100%"
            }}>
              {checkoutLoading ? "Redirecting..." : "Get Pro — $29/mo"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
          Clay charges $495/month for the same personalization. This is the part they do well, at 1/17th the price.
        </p>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.03em" }}>
          Your next cold email writes itself.
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: 32, fontSize: 16 }}>
          No credit card. No workflow setup. Just results.
        </p>
        <Link href="/tool" className="btn-primary" style={{ fontSize: 16, padding: "14px 32px", textDecoration: "none" }}
          onClick={() => track("activation", { source: "cta" })}
        >
          Try it free
        </Link>
      </section>

      {/* Feature Requests Board */}
      <section style={{ padding: "64px 24px", maxWidth: 760, margin: "0 auto", width: "100%", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Feature requests
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>
              What should we build next?
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Vote on requests or submit your own. Sorted by popularity.
            </p>
          </div>
          <button
            onClick={() => setFrOpen((o) => !o)}
            className="btn-primary"
            style={{ fontSize: 14, padding: "10px 20px", flexShrink: 0 }}
          >
            + Request feature
          </button>
        </div>

        {/* Submit form */}
        {frOpen && (
          <div className="card" style={{ marginBottom: 24, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Submit a feature request</h3>
            <form onSubmit={handleSubmitRequest} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  placeholder="e.g. LinkedIn URL support"
                  value={frTitle}
                  onChange={(e) => setFrTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input"
                  placeholder="More context about what you need and why..."
                  value={frDesc}
                  onChange={(e) => setFrDesc(e.target.value)}
                  maxLength={500}
                  style={{ resize: "vertical", minHeight: 72 }}
                />
              </div>
              {frError && (
                <div style={{
                  background: "color-mix(in oklab, #ef4444 12%, transparent)",
                  border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5"
                }}>
                  {frError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={frStatus === "loading" || !frTitle.trim()}
                  style={{ fontSize: 14, padding: "9px 20px" }}
                >
                  {frStatus === "loading" ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => { setFrOpen(false); setFrError(""); }}
                  style={{
                    background: "none", border: "1px solid var(--border)", borderRadius: 8,
                    padding: "9px 18px", fontSize: 14, color: "var(--muted)", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {frStatus === "success" && (
          <div style={{
            background: "color-mix(in oklab, var(--success) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
            borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "var(--success)", marginBottom: 20
          }}>
            Request submitted. Thanks for the feedback!
          </div>
        )}

        {/* Requests list */}
        {requests.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 24px",
            border: "1px dashed var(--border)", borderRadius: 10, color: "var(--muted)", fontSize: 14
          }}>
            No requests yet. Be the first to suggest a feature.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {requests.map((r) => (
              <div key={r.id} className="card" style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px" }}>
                {/* Vote button */}
                <button
                  onClick={() => handleVote(r.id)}
                  disabled={votedIds.has(r.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    background: votedIds.has(r.id)
                      ? "color-mix(in oklab, var(--accent) 15%, transparent)"
                      : "var(--bg)",
                    border: votedIds.has(r.id)
                      ? "1px solid color-mix(in oklab, var(--accent) 40%, transparent)"
                      : "1px solid var(--border)",
                    borderRadius: 8, padding: "8px 12px", cursor: votedIds.has(r.id) ? "default" : "pointer",
                    flexShrink: 0, minWidth: 52,
                  }}
                >
                  <span style={{ fontSize: 14, color: votedIds.has(r.id) ? "#a5b4fc" : "var(--muted)" }}>&#9650;</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: votedIds.has(r.id) ? "#a5b4fc" : "var(--text)" }}>
                    {r.votes}
                  </span>
                </button>
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: r.description ? 4 : 0 }}>
                    {r.title}
                  </p>
                  {r.description && (
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{r.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 13, color: "var(--muted)"
      }}>
        <span style={{ fontWeight: 700, color: "var(--text)" }}>icebreak</span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span>Not affiliated with Clay. Built for the people they priced out.</span>
          <Link href="/login" style={{ color: "var(--muted)", textDecoration: "none" }}>Pro login</Link>
        </div>
      </footer>
    </main>
  );
}
