// 14-settings — ZiroWork operator settings
function SettingsView({ onNavigate }) {
  const T = window.T || {};
  const operator = window.currentOperator || {};
  const user = window.currentUser || {};

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      <div style={{ background: T.cardBg || 'var(--surface)', border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, action, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: last ? 'none' : `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{label}</div>
        {value && <div style={{ fontSize: 12, color: T.t4, marginTop: 2 }}>{value}</div>}
      </div>
      {action && (
        <button style={{ padding: '5px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'none', fontSize: 12, color: T.t3, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {action}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px', maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', marginBottom: 4 }}>Settings</div>
        <div style={{ fontSize: 13, color: T.t3 }}>Operator account and system configuration</div>
      </div>

      <Section title="Operator Account">
        <Row label="Operator name" value={operator.name || 'ZiroWork'} action="Edit" />
        <Row label="Operator user" value={user.full_name || 'Zach Adkins'} />
        <Row label="Email" value={user.email || 'slavior1992@gmail.com'} action="Edit" />
        <Row label="Role" last action={null}
          value={null}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 14px' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, background: T.accent + '18', padding: '3px 10px', borderRadius: 20 }}>Operator</span>
        </div>
      </Section>

      <Section title="Speed-to-Lead">
        <Row label="Target response time" value="Under 60 seconds" action="Configure" />
        <Row label="AI handoff rule" value="Billing, cancellations, angry parents → escalate" action="Edit" />
        <Row label="Business hours" value="Mon–Fri 8am–8pm · Sat 9am–5pm" action="Edit" last />
      </Section>

      <Section title="Notifications">
        <Row label="Escalation alerts" value="Immediate — SMS + email" action="Configure" />
        <Row label="Daily digest" value="Every day at 7:00 AM" action="Configure" />
        <Row label="New lead alerts" value="Enabled" action="Configure" last />
      </Section>

      <Section title="System">
        <Row label="Backend" value="DEV — local seed data (no backend wired)" />
        <Row label="Version" value="ZiroWork Operator CRM — Phase 1" last />
      </Section>
    </div>
  );
}

window.SettingsView = SettingsView;
