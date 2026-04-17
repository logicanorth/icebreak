"use client";
import { useEffect } from "react";
import Link from "next/link";

// Dynamic import to avoid Turbopack bundling issues
let sentryCapture: ((err: unknown) => void) | null = null;
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import("@sentry/browser").then(({ init, captureException }) => {
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
    sentryCapture = captureException;
  });
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error:", error);
    sentryCapture?.(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 480 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e8e8f0", marginBottom: 12, letterSpacing: "-0.03em" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#6b6b85", lineHeight: 1.6, marginBottom: 28 }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
            <Link href="/" style={{ display: "inline-block", padding: "11px 24px", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 14, color: "#6b6b85", textDecoration: "none" }}>
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
