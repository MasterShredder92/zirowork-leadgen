// 15-insights — What patterns, playbooks, and benchmarks help ZiroWork operate better?
function InsightsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};

  const PLAYBOOKS = [
    {
      id: 1, category: 'SPEED-TO-LEAD', accent: '#818CF8', tag: 'North Star',
      title: 'The 60-Second Rule',
      excerpt: 'ALAN (Acquisition.com\'s AI lead automation) grew to $1.4M/month in 6 months by working leads inside 60 seconds. Every minute of delay cuts conversion. ZiroWork\'s AI must reply before the parent closes the tab.',
      read: '5 min',
    },
    {
      id: 2, category: 'ENROLLMENT', accent: '#22C55E', tag: 'Playbook',
      title: 'Protected Trial Slots',
      excerpt: 'Don\'t expose the full calendar on day one. Protect 3–5 trial slots per teacher per week. Give parents a real choice without overwhelming the school or requiring full calendar integration.',
      read: '4 min',
    },
    {
      id: 3, category: 'ESCALATION', accent: '#EF4444', tag: 'Rule',
      title: 'What AI Must Never Handle',
      excerpt: 'Billing, refunds, cancellations, angry parents, and current-student issues always escalate. AI handles new enrollment conversations only. Violating this burns client trust instantly.',
      read: '3 min',
    },
    {
      id: 4, category: 'CAMPAIGNS', accent: '#F59E0B', tag: 'Benchmark',
      title: 'Program Priority: Piano First',
      excerpt: 'Piano has the highest search volume and widest parent appeal. Lead with Piano, then Guitar. Voice and Drums are secondary until Pipeline is proven. Stack campaigns by program, one at a time.',
      read: '4 min',
    },
    {
      id: 5, category: 'ROI', accent: '#EC4899', tag: 'Framework',
      title: 'Proving Value to Clients',
      excerpt: 'Every client report answers one question: why should this school keep paying ZiroWork? Leads captured, trials booked, enrollment rate, weekly revenue added, response time. Five numbers close the loop.',
      read: '6 min',
    },
    {
      id: 6, category: 'PHASE PLAN', accent: '#6B7280', tag: 'Roadmap',
      title: 'Build Sequence: Phase 1→4',
      excerpt: 'Phase 1: Lead conversion (this). Phase 2: Revenue recovery (no-shows, follow-ups, retention). Phase 3: Integrations (My Music Staff, GHL, Stripe). Phase 4: Operations layer (staff scheduling, reporting dashboards).',
      read: '7 min',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Insights</h1>
        <div style={{ fontSize: 12, color: T.t3 }}>What patterns, playbooks, and benchmarks help ZiroWork operate better?</div>
      </div>

      {/* Scrollable content — flat rows, hairline separated, accent strip indicator */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
        {PLAYBOOKS.map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 16, padding: '20px 8px', margin: '0 -8px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 3, alignSelf: 'stretch', background: p.accent, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: p.accent, background: p.accent + '18', padding: '2px 7px', borderRadius: 20, letterSpacing: '0.06em' }}>{p.category}</span>
                <span style={{ fontSize: 10, color: T.t4 }}>{p.tag}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 8, lineHeight: 1.4 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: T.t3, lineHeight: 1.6, marginBottom: 12, maxWidth: 720 }}>{p.excerpt}</div>
              <div style={{ fontSize: 11, color: T.t4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {L.Clock && <L.Clock size={11} strokeWidth={1.75} />} {p.read} read
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.InsightsView = InsightsView;
