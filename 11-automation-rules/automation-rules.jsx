// 11-automation-rules — What should AI say, do, pause, or escalate?
function AutomationRulesView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};

  const { data: rawData } = window.useAutomationRules ? window.useAutomationRules() : { data: [] };
  const [rules, setRules] = React.useState([]);
  React.useEffect(() => { if (rawData) setRules(rawData); }, [rawData]);

  const modeColor  = m => ({ ai: '#818CF8', escalate: '#EF4444', pause: '#F59E0B' }[m] || '#6B7280');
  const modeLabel  = m => ({ ai: 'AI', escalate: 'Escalate', pause: 'Pause' }[m] || m);
  const statColor  = s => ({ active: '#22C55E', paused: '#F59E0B' }[s] || '#6B7280');

  async function toggleRule(rule) {
    if (!window.sb) return;
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    const { error } = await window.sb.from('automation_rules').update({ status: newStatus }).eq('id', rule.id);
    if (!error) setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Automation Rules</h1>
          <div style={{ fontSize: 12, color: T.t3 }}>What should AI say, do, pause, or escalate?</div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Plus && <L.Plus size={14} strokeWidth={1.75} />} Add Rule
        </button>
      </div>

      {/* Scrollable content — flat rows, hairline separated */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ padding: '14px 8px', margin: '0 -8px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 16, borderRadius: 6, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: modeColor(rule.mode) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: modeColor(rule.mode) }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 2 }}>{rule.name}</div>
              <div style={{ fontSize: 11, color: T.t4, display: 'flex', gap: 8 }}>
                <span>When: {rule.trigger}</span>
                <span>·</span>
                <span>Then: {rule.action}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: modeColor(rule.mode), background: modeColor(rule.mode) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                {modeLabel(rule.mode)}
              </span>
              <button onClick={() => toggleRule(rule)}
                style={{ fontSize: 10, fontWeight: 600, color: statColor(rule.status), background: statColor(rule.status) + '1A', padding: '2px 8px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {rule.status}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.AutomationRulesView = AutomationRulesView;
