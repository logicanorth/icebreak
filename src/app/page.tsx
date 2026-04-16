import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>
          icebreak
        </span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#pricing" style={{ color: "var(--muted)", fontSize: 14, textDecoration: "none" }}>
            Pricing
          </a>
          <Link
            href="/tool"
            style={{
              background: "var(--accent)",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Try free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 60px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "color-mix(in oklab, var(--accent) 15%, transparent)",
            border: "1px solid color-mix(in oklab, var(--accent) 30%, transparent)",
            borderRadius: 20,
            padding: "5px 14px",
            marginBottom: 32,
            fontSize: 13,
            fontWeight: 500,
            color: "#a5b4fc",
          }}
        >
          Clay just raised prices to $495/mo. We did not.
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: 760,
            marginBottom: 24,
          }}
        >
          Personalized cold emails
          <br />
          <span style={{ color: "var(--accent)" }}>in 10 seconds flat</span>
        </h1>
        <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 520, lineHeight: 1.6, marginBottom: 40 }}>
          Paste a company URL and your offer. Icebreak reads their website and writes a
          hyper-personalized email — subject line, opener, and close. No workflow builder. No credit
          system. Just emails.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/tool"
            className="btn-primary"
            style={{ fontSize: 16, padding: "14px 32px", textDecoration: "none" }}
          >
            Generate your first email free
          </Link>
          <a
            href="#how"
            style={{
              color: "var(--muted)",
              fontSize: 15,
              padding: "14px 24px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            See how it works
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          5 free emails per day. No credit card required.
        </p>
      </section>

      {/* Stats bar */}
      <section style={{ display: "flex", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        {[
          { num: "10s", label: "average generation time" },
          { num: "$29/mo", label: "vs $495/mo for Clay Growth" },
          { num: "3 inputs", label: "name, URL, your pitch" },
        ].map((item, i) => (
          <div
            key={item.num}
            style={{
              flex: 1,
              padding: "28px 24px",
              textAlign: "center",
              borderRight: i < 2 ? "1px solid var(--border)" : undefined,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
              {item.num}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <p
          style={{
            fontSize: 13,
            color: "var(--accent)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          How it works
        </p>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 56,
            letterSpacing: "-0.03em",
          }}
        >
          Three inputs. One great email.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[
            { step: "01", title: "Add prospect info", desc: "Name, title, and company website URL. That's all we need." },
            { step: "02", title: "Describe your offer", desc: "One sentence on what you sell and who it helps." },
            { step: "03", title: "Get the email", desc: "Subject line, personalized opener, value prop, and CTA — ready to copy." },
          ].map((item) => (
            <div key={item.step} className="card">
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 12 }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <p
          style={{
            fontSize: 13,
            color: "var(--accent)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Pricing
        </p>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 48,
            letterSpacing: "-0.03em",
          }}
        >
          Simple. No credits.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Free tier */}
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
            <Link
              href="/tool"
              style={{
                marginTop: "auto",
                textAlign: "center",
                padding: "11px 0",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                textDecoration: "none",
                display: "block",
              }}
            >
              Start free
            </Link>
          </div>

          {/* Pro tier */}
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              border: "1px solid var(--accent)",
              background: "color-mix(in oklab, var(--accent) 6%, var(--surface))",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>Pro</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "2px 7px",
                  }}
                >
                  MOST POPULAR
                </span>
              </div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em" }}>$29</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>per month</div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Unlimited emails",
                "Bulk CSV upload",
                "Tone variants (casual / formal)",
                "Export to CSV",
                "Priority speed",
              ].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "var(--muted)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>+</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/tool?upgrade=1"
              className="btn-primary"
              style={{ marginTop: "auto", textAlign: "center", justifyContent: "center", textDecoration: "none", display: "flex" }}
            >
              Get Pro — $29/mo
            </Link>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
          Clay charges $495/month for the same personalization. This is the part they do well, at
          1/17th the price.
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
        <Link
          href="/tool"
          className="btn-primary"
          style={{ fontSize: 16, padding: "14px 32px", textDecoration: "none" }}
        >
          Try it free
        </Link>
      </section>

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--text)" }}>icebreak</span>
        <span>Not affiliated with Clay. Built for the people they priced out.</span>
      </footer>
    </main>
  );
}
