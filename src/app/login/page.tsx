"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "expired") {
      setStatus("error");
      setErrorMsg("That login link has expired. Request a new one below.");
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
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", textDecoration: "none", display: "block", marginBottom: 24 }}>
          icebreak
        </Link>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              We sent a login link to <strong style={{ color: "var(--text)" }}>{email}</strong>. Click it to sign in.
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
              Link expires in 15 minutes.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to Icebreak</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Enter your email and we will send you a magic login link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {status === "error" && errorMsg && (
                <div style={{ fontSize: 13, color: "#fca5a5", background: "color-mix(in oklab, #ef4444 12%, transparent)", border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)", borderRadius: 8, padding: "10px 14px" }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={status === "loading"} style={{ width: "100%", justifyContent: "center" }}>
                {status === "loading" ? "Sending..." : "Send login link"}
              </button>
            </form>

            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 20, textAlign: "center" }}>
              Don't have Pro?{" "}
              <Link href="/#pricing" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Get started for $29/mo
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
