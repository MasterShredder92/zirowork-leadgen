// 14-settings — ZiroWork operator settings
function SettingsView({ onNavigate }) {
  const T = window.T || {};
  const operator = window.currentOperator || {};
  const user = window.currentUser || {};

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 8, borderBottom: `1px solid ${T.border}`, marginBottom: 2 }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, value, action, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.t1 }}>{label}</div>
        {value && <div style={{ fontSize: 13, color: T.t4, marginTop: 2 }}>{value}</div>}
      </div>
      {action && (
        <button style={{ padding: '5px 12px', border: `1px solid ${T.border}`, borderRadius: 7, background: 'transparent', fontSize: 13, color: T.t2, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {action}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Settings</h1>
        <div style={{ fontSize: 13, color: T.t3 }}>Operator account and system configuration</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 640 }}>

      <Section title="Operator Account">
        <Row label="Operator name" value={operator.name || 'ZiroWork'} />
        <Row label="Operator user" value={user.full_name || 'Zach Adkins'} />
        <Row label="Email" value={user.email || 'slavior1992@gmail.com'} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.t1 }}>Role</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.accent, background: T.accent + '18', padding: '3px 10px', borderRadius: 20 }}>Operator</span>
        </div>
      </Section>

      <Section title="Speed-to-Lead">
        <Row label="Target response time" value="Under 60 seconds" />
        <Row label="AI handoff rule" value="Billing, cancellations, angry parents → escalate" />
        <Row label="Business hours" value="Mon–Fri 8am–8pm · Sat 9am–5pm" last />
      </Section>

      <Section title="Notifications">
        <Row label="Escalation alerts" value="Immediate — SMS + email" />
        <Row label="Daily digest" value="Every day at 7:00 AM" />
        <Row label="New lead alerts" value="Enabled" last />
      </Section>

      <Section title="System">
        <Row label="Backend" value="Supabase — live (project txpgyuetfsrzfxxopwzf)" />
        <Row label="Version" value="ZiroWork Operator CRM — Phase 2" last />
      </Section>

      </div>
      </div>
    </div>
  );
}

window.SettingsView = SettingsView;
