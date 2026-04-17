"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface CSVRow {
  prospectName: string;
  prospectTitle: string;
  companyUrl: string;
  yourOffer: string;
  tone: "professional" | "casual" | "direct";
}

interface BulkResult {
  prospectName: string;
  companyUrl: string;
  subject: string;
  body: string;
  error?: string;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  // Skip header row
  return lines.slice(1).slice(0, 50).map((line) => {
    const cols: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return {
      prospectName: cols[0] ?? "",
      prospectTitle: cols[1] ?? "",
      companyUrl: cols[2] ?? "",
      yourOffer: cols[3] ?? "",
      tone: "professional" as const,
    };
  }).filter((r) => r.prospectName && r.companyUrl && r.yourOffer);
}

function toCSV(results: BulkResult[]): string {
  const header = "Name,Company URL,Subject,Body,Error";
  const rows = results.map((r) =>
    [r.prospectName, r.companyUrl, r.subject, r.body, r.error ?? ""]
      .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

export default function BulkPage() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pro/status")
      .then((r) => r.json())
      .then((d) => setIsPro(d.isPro ?? false))
      .catch(() => setIsPro(false));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
      setResults(null);
      setError("");
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!rows.length) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/generate/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const csv = toCSV(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icebreak-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = `name,title,company_url,offer\nAlex Kim,Head of Growth,acmecorp.com,"We help SaaS companies reduce churn by 30%"`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icebreak-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isPro === null) return null;

  if (!isPro) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 400 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Pro feature</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Bulk CSV generation is available on the Pro plan — $29/mo for unlimited emails.
          </p>
          <Link href="/#pricing" className="btn-primary" style={{ textDecoration: "none", justifyContent: "center" }}>
            Get Pro — $29/mo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", textDecoration: "none" }}>icebreak</Link>
        <Link href="/tool" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Single email</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Bulk email generator</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>Upload a CSV, get personalized emails for every prospect. Max 50 rows per run.</p>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Upload CSV</span>
            <button onClick={downloadTemplate} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
              Download template
            </button>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Required columns: <code style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4 }}>name, title, company_url, offer</code></p>
          <input type="file" accept=".csv" onChange={handleFile} style={{ fontSize: 14, color: "var(--text)" }} />
          {fileName && <p style={{ fontSize: 13, color: "var(--success)" }}>{fileName} — {rows.length} valid rows loaded</p>}
        </div>

        {rows.length > 0 && (
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Name", "Title", "Company URL", "Offer"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>{r.prospectName}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{r.prospectTitle}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{r.companyUrl}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.yourOffer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: "#fca5a5", background: "color-mix(in oklab, #ef4444 12%, transparent)", border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)", borderRadius: 8, padding: "10px 14px" }}>{error}</div>}

        {rows.length > 0 && !results && (
          <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ alignSelf: "flex-start", minWidth: 200, justifyContent: "center" }}>
            {loading ? `Generating ${rows.length} emails...` : `Generate ${rows.length} emails`}
          </button>
        )}

        {loading && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>This takes about 10 seconds per email. Hang tight.</p>
        )}

        {results && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Results — {results.filter((r) => !r.error).length}/{results.length} generated</h2>
              <button onClick={handleDownload} className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>Download CSV</button>
            </div>
            <div className="card" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Name", "Company", "Subject", "Preview"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={{ opacity: r.error ? 0.5 : 1 }}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>{r.prospectName}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{r.companyUrl}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>{r.error ? <span style={{ color: "#f59e0b" }}>Failed</span> : r.subject}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--muted)", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error ?? r.body?.slice(0, 80)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
