import { Clock } from "lucide-react";

// Accent color token references (no hex in components — see globals.css --color-insight-*)
const PLAYBOOKS = [
  {
    id: 1, category: "SPEED-TO-LEAD", colorVar: "--color-insight-0", tag: "North Star",
    title: "The 60-Second Rule",
    excerpt: "ALAN (Acquisition.com's AI lead automation) grew to $1.4M/month in 6 months by working leads inside 5 minutes. Every minute of delay cuts conversion. ZiroWork's AI must reply before the parent closes the tab.",
    read: "5 min",
  },
  {
    id: 2, category: "ENROLLMENT", colorVar: "--color-insight-1", tag: "Playbook",
    title: "Protected Trial Slots",
    excerpt: "Don't expose the full calendar on day one. Protect 3–5 trial slots per teacher per week. Give parents a real choice without overwhelming the school or requiring full calendar integration.",
    read: "4 min",
  },
  {
    id: 3, category: "ESCALATION", colorVar: "--color-insight-2", tag: "Rule",
    title: "What AI Must Never Handle",
    excerpt: "Billing, refunds, cancellations, angry parents, and current-student issues always escalate. AI handles new enrollment conversations only. Violating this burns client trust instantly.",
    read: "3 min",
  },
  {
    id: 4, category: "CAMPAIGNS", colorVar: "--color-insight-3", tag: "Benchmark",
    title: "Program Priority: Piano First",
    excerpt: "Piano has the highest search volume and widest parent appeal. Lead with Piano, then Guitar. Voice and Drums are secondary until Pipeline is proven. Stack campaigns by program, one at a time.",
    read: "4 min",
  },
  {
    id: 5, category: "ROI", colorVar: "--color-insight-4", tag: "Framework",
    title: "Proving Value to Clients",
    excerpt: "Every client report answers one question: why should this school keep paying ZiroWork? Leads captured, trials booked, enrollment rate, weekly revenue added, response time. Five numbers close the loop.",
    read: "6 min",
  },
  {
    id: 6, category: "PHASE PLAN", colorVar: "--color-insight-5", tag: "Roadmap",
    title: "Build Sequence: Phase 1→4",
    excerpt: "Phase 1: Lead conversion (this). Phase 2: Revenue recovery (no-shows, follow-ups, retention). Phase 3: Integrations (My Music Staff, GHL, Stripe). Phase 4: Operations layer (staff scheduling, reporting dashboards).",
    read: "7 min",
  },
];

export default function InsightsView() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>
          Insights
        </h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          What patterns, playbooks, and benchmarks help ZiroWork operate better?
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px" }}>
        {PLAYBOOKS.map((p) => (
          <div
            key={p.id}
            className="insights-row"
            style={{
              display: "flex", gap: 16, padding: "20px 8px", margin: "0 -8px",
              borderBottom: "1px solid var(--color-border)",
              cursor: "pointer", borderRadius: 6,
            }}
          >
            {/* Accent strip */}
            <div style={{ width: 3, alignSelf: "stretch", background: `var(${p.colorVar})`, borderRadius: 2, flexShrink: 0 }} />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: `var(${p.colorVar})`,
                  background: `color-mix(in srgb, var(${p.colorVar}) 9%, transparent)`,
                  padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em",
                }}>
                  {p.category}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-4)" }}>{p.tag}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-1)", marginBottom: 8, lineHeight: 1.4 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-3)", lineHeight: 1.6, marginBottom: 12, maxWidth: 720 }}>
                {p.excerpt}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-4)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} strokeWidth={1.75} /> {p.read} read
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
