"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CheckoutSuccessPage() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Animate dots while user reads
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "1px solid var(--border)",
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", textDecoration: "none", letterSpacing: "-0.02em" }}>
          icebreak
        </Link>
      </nav>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px",
      }}>
        <div style={{
          width: "100%", maxWidth: 480, textAlign: "center",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "48px 40px",
        }}>
          {/* Success icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "color-mix(in oklab, var(--success) 15%, transparent)",
            border: "1px solid color-mix(in oklab, var(--success) 35%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px", fontSize: 28,
          }}>
            &#10003;
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, color: "var(--text)" }}>
            Payment successful
          </h1>

          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.65, marginBottom: 32 }}>
            Your Icebreak Pro subscription is active. We just sent a magic login link
            to your email address. Click it to access your Pro account — the link expires in 15 minutes.
          </p>

          {/* Steps */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 12,
            textAlign: "left", marginBottom: 36,
            background: "var(--bg)", borderRadius: 10,
            padding: "20px 20px", border: "1px solid var(--border)",
          }}>
            {[
              { step: "1", text: "Open your email inbox", done: false },
              { step: "2", text: "Find the email from Icebreak", done: false },
              { step: "3", text: "Click \"Log in to Icebreak Pro\"", done: false },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "color-mix(in oklab, var(--accent) 20%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--accent) 40%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#a5b4fc",
                }}>
                  {s.step}
                </div>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{s.text}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
            Didn't get the email? Check spam, or use the button below to resend it.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/login" className="btn-primary" style={{
              display: "block", textAlign: "center", textDecoration: "none",
              padding: "13px 0", fontSize: 15,
            }}>
              Go to Pro login
            </Link>
            <Link href="/" style={{
              display: "block", textAlign: "center", fontSize: 14,
              color: "var(--muted)", textDecoration: "none", padding: "8px 0",
            }}>
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
