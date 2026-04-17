"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "expired") {
      setErrorMsg("That login link has expired or already been used. Enter your email to get a new one.");
      setStatus("error");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
    }}>
      {/* Nav */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 32px",
        borderBottom: "1px solid var(--border)",
      }}>
        <Link href="/" style={{
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text)",
          textDecoration: "none",
          letterSpacing: "-0.02em",
        }}>
          icebreak
        </Link>
      </nav>

      {/* Card */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "40px 36px",
        }}>
          {status === "sent" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "color-mix(in oklab, var(--success) 15%, transparent)",
                border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: 24,
              }}>
                &#10003;
              </div>
              <h1 style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 12,
                letterSpacing: "-0.03em",
              }}>
                Check your email
              </h1>
              <p style={{
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.6,
                marginBottom: 28,
              }}>
                We sent a login link to <strong style={{ color: "var(--text)" }}>{email}</strong>. Click it to access your Pro account. The link expires in 15 minutes.
              </p>
              <button
                onClick={() => { setStatus("idle"); setEmail(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: 14,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 8,
                letterSpacing: "-0.03em",
              }}>
                Pro login
              </h1>
              <p style={{
                fontSize: 14,
                color: "var(--muted)",
                marginBottom: 28,
                lineHeight: 1.6,
              }}>
                Enter the email you used to subscribe. We'll send you a magic link to log in.
              </p>

              {status === "error" && errorMsg && (
                <div style={{
                  background: "color-mix(in oklab, #ef4444 12%, transparent)",
                  border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#fca5a5",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="label">Email address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={status === "loading"}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={status === "loading" || !email.trim()}
                  style={{ justifyContent: "center" }}
                >
                  {status === "loading" ? (
                    <>
                      <span style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }} />
                      Sending...
                    </>
                  ) : (
                    "Send login link"
                  )}
                </button>
              </form>

              <p style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 13,
                color: "var(--muted)",
              }}>
                Don't have a Pro account?{" "}
                <Link href="/#pricing" style={{ color: "var(--accent)", textDecoration: "none" }}>
                  View pricing
                </Link>
              </p>
            </>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
