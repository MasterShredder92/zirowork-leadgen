import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZiroWork — Speed-to-Lead Enrollment for Music Schools",
  description: "ZiroWork is a lead-response and enrollment platform for music schools. We answer new student inquiries by text within minutes and hand schools enrolled students.",
};

const T = {
  bg: "#F7F2E8",
  ink: "#1A1C1F",
  t2: "#4a4843",
  t3: "#7a766d",
  accent: "#D9641C",
  line: "#E8DCC8",
} as const;

export default function HomePage() {
  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1.6 }}>

      {/* Header */}
      <header style={{ padding: "28px 0", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/96-public/icon.svg?v=3" alt="ZiroWork" style={{ width: 28, height: 28 }} />
            ZiroWork
          </div>
          <div style={{ fontSize: 13, color: T.t3 }}>Speed-to-lead for music schools</div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "88px 24px 56px" }}>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 54px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 720, margin: 0 }}>
            Every new student inquiry, answered in <em style={{ color: T.accent, fontStyle: "normal" }}>minutes</em> — not days.
          </h1>
          <p style={{ fontSize: 18, color: T.t2, marginTop: 18, maxWidth: 640 }}>
            ZiroWork is a lead-response and enrollment platform for music schools. We build each school&apos;s lesson landing pages, respond to new student inquiries instantly by text message, and hand the school an enrolled student ready for their first lesson.
          </p>
        </div>

        {/* Section: What we do */}
        <section style={{ padding: "48px 0", borderTop: `1px solid ${T.line}` }}>
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.t3, marginBottom: 22 }}>What we do</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Branded landing pages</h3>
                <p style={{ fontSize: 14, color: T.t2, margin: 0 }}>Each partner school gets lesson pages in their own brand where families request information about piano, guitar, voice, or drum lessons.</p>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Instant follow-up</h3>
                <p style={{ fontSize: 14, color: T.t2, margin: 0 }}>When a family submits an inquiry and opts in to texting, we follow up within minutes to answer questions, match a teacher, and offer lesson times.</p>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Enrolled-student handoff</h3>
                <p style={{ fontSize: 14, color: T.t2, margin: 0 }}>Once a student confirms a lesson time, we hand everything to the school. Our job ends when the student is enrolled and on the schedule.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: SMS */}
        <section style={{ padding: "48px 0", borderTop: `1px solid ${T.line}` }}>
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.t3, marginBottom: 22 }}>Our text messaging program</h2>
            <p style={{ fontSize: 14, color: T.t2, maxWidth: 720, marginBottom: 10 }}>
              ZiroWork sends text messages to prospective students (or their parents) who request lesson information through a partner school&apos;s signup form and check an optional consent box agreeing to receive texts. Messages are conversational follow-ups about that lesson inquiry — answering questions, matching a teacher, and confirming lesson times — sent by ZiroWork on behalf of the school the family contacted.
            </p>
            <p style={{ fontSize: 14, color: T.t2, maxWidth: 720, marginBottom: 10 }}>
              Message frequency varies (typically up to 8 messages per inquiry). Message and data rates may apply. Reply <strong>HELP</strong> for help or <strong>STOP</strong> to cancel at any time. Consent is not a condition of enrollment. Mobile opt-in data is never shared with third parties or affiliates for marketing or promotional purposes.
            </p>
            <p style={{ fontSize: 14, color: T.t2, maxWidth: 720, margin: 0 }}>
              See our <a href="/privacy" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>Privacy Policy</a> and <a href="/terms" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>Terms &amp; Conditions</a>.
            </p>
          </div>
        </section>

        {/* Section: Contact */}
        <section style={{ padding: "48px 0", borderTop: `1px solid ${T.line}` }}>
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.t3, marginBottom: 22 }}>Contact</h2>
            <p style={{ fontSize: 15, color: T.t2, marginBottom: 6 }}>ZiroWork</p>
            <p style={{ fontSize: 15, color: T.t2, marginBottom: 6 }}>
              Email: <a href="mailto:hello@zirowork.com" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>hello@zirowork.com</a>
            </p>
            <p style={{ fontSize: 15, color: T.t2, margin: 0 }}>Omaha, Nebraska, USA</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.line}`, padding: "28px 0 40px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: T.t3 }}>© 2026 ZiroWork. All rights reserved.</div>
          <div style={{ fontSize: 13, color: T.t3 }}>
            <a href="/privacy" style={{ color: T.t3, textDecoration: "none" }}>Privacy Policy</a>
            &nbsp;·&nbsp;
            <a href="/terms" style={{ color: T.t3, textDecoration: "none" }}>Terms &amp; Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
