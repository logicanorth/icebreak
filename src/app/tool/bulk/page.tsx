"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ParsedRow {
  name: string;
  title: string;
  company_url: string;
  offer: string;
}

interface BulkResult {
  prospectName: string;
  companyUrl: string;
  subject: string;
  body: string;
  openingLineNote: string;
  error?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    // Accept flexible column names
    const name = row["name"] ?? row["prospect_name"] ?? row["prospect"] ?? "";
    const title = row["title"] ?? row["prospect_title"] ?? row["job_title"] ?? "";
    const company_url = row["company_url"] ?? row["url"] ?? row["website"] ?? row["company"] ?? "";
    const offer = row["offer"] ?? row["your_offer"] ?? row["pitch"] ?? "";
    if (name || company_url) {
      rows.push({ name, title, company_url, offer });
    }
  }

  return rows.slice(0, 50);
}

function downloadCSV(results: BulkResult[]) {
  const headers = ["Name", "Company URL", "Subject", "Body", "Opening Line Note", "Error"];
  function escape(val: string) {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }
  const rows = results.map((r) =>
    [r.prospectName, r.companyUrl, r.subject, r.body, r.openingLineNote, r.error ?? ""]
      .map(escape)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "icebreak-bulk-results.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  const csv = `name,title,company_url,offer
Alex Kim,Head of Growth,acmecorp.com,We help SaaS companies reduce churn by 30% with automated onboarding sequences.
Jordan Lee,VP Sales,betastartup.io,Our AI-powered CRM automatically logs every call and surfaces follow-up tasks.`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "icebreak-bulk-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkPage() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pro/status")
      .then((r) => r.json())
      .then((d) => {
        setIsPro(d.isPro ?? false);
        setUserEmail(d.email ?? null);
      })
      .catch(() => setIsPro(false));
  }, []);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults([]);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      const parsed = parseCSV(text);
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!rows.length) return;
    setGenerating(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/generate/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            prospectName: r.name,
            prospectTitle: r.title,
            companyUrl: r.company_url,
            yourOffer: r.offer,
            tone: "professional",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Loading state
  if (isPro === null) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // Upgrade wall
  if (!isPro) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", textDecoration: "none" }}>icebreak</Link>
          <Link href="/tool" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none" }}>Back to tool</Link>
        </nav>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: 40, marginBottom: 24 }}>&#128274;</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>Pro feature</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
              Bulk CSV generation is available on the Pro plan. Upload up to 50 prospects at once and download the results as CSV.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleUpgrade} disabled={checkoutLoading} className="btn-primary">
                {checkoutLoading ? "Redirecting..." : "Upgrade to Pro — $29/mo"}
              </button>
              <Link href="/login" style={{ padding: "12px 24px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 15, fontWeight: 600, color: "var(--text)", textDecoration: "none", display: "inline-block" }}>
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", textDecoration: "none" }}>icebreak</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Pro</span>
          <Link href="/tool" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Single email</Link>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 500, color: "var(--text)", cursor: "pointer" }}
          >
            {portalLoading ? "..." : "My account"}
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 1000, margin: "0 auto", width: "100%", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Bulk email generator</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>
          Upload a CSV with up to 50 prospects. We'll generate personalized emails for each one.
        </p>

        {/* Upload area */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Upload CSV</h2>
            <button
              onClick={downloadTemplate}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "var(--muted)", cursor: "pointer" }}
            >
              Download template
            </button>
          </div>

          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Required columns: <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>name</code>, <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>title</code>, <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>company_url</code>, <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>offer</code>
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: 10,
              padding: "32px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>&#128196;</div>
            {fileName ? (
              <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{fileName}</p>
            ) : (
              <p style={{ fontSize: 14, color: "var(--muted)" }}>Click to choose a CSV file, or drag and drop</p>
            )}
            {rows.length > 0 && (
              <p style={{ fontSize: 13, color: "var(--success)", marginTop: 8 }}>{rows.length} row{rows.length !== 1 ? "s" : ""} loaded</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="card" style={{ marginBottom: 24, overflowX: "auto" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Preview ({rows.length} prospects)</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Name", "Title", "Company URL", "Offer"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text)", fontWeight: 500 }}>{row.name}</td>
                    <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{row.title}</td>
                    <td style={{ padding: "10px 12px", color: "var(--muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.company_url}</td>
                    <td style={{ padding: "10px 12px", color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.offer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "color-mix(in oklab, #ef4444 12%, transparent)", border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#fca5a5", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Generate button */}
        {rows.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ minWidth: 200 }}
            >
              {generating ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Generating {rows.length} email{rows.length !== 1 ? "s" : ""}...
                </>
              ) : (
                `Generate all ${rows.length} email${rows.length !== 1 ? "s" : ""}`
              )}
            </button>
            {generating && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
                This may take a minute. Each email fetches the company website and calls Claude.
              </p>
            )}
          </div>
        )}

        {/* Results table */}
        {results.length > 0 && (
          <div className="card" style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Results ({results.length})</h2>
              <button
                onClick={() => downloadCSV(results)}
                className="btn-primary"
                style={{ fontSize: 13, padding: "8px 18px" }}
              >
                Download CSV
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Name", "Company", "Subject line", "Body preview"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap" }}>{r.prospectName}</td>
                    <td style={{ padding: "12px", color: "var(--muted)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.companyUrl}</td>
                    <td style={{ padding: "12px", color: r.error ? "#fca5a5" : "var(--text)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.error ? `Error: ${r.error}` : r.subject}
                    </td>
                    <td style={{ padding: "12px", color: "var(--muted)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.body ? r.body.slice(0, 80) + (r.body.length > 80 ? "..." : "") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
