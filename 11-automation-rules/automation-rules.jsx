// 11-automation-rules — What should AI say, do, pause, or escalate?
function AutomationRulesView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};

  const { data: rawData } = window.useAutomationRules ? window.useAutomationRules() : { data: [] };
  const { data: clients } = window.useClients ? window.useClients() : { data: [] };
  const [rules, setRules] = React.useState([]);
  React.useEffect(() => { if (rawData) setRules(rawData); }, [rawData]);

  const modeColor  = m => ({ ai: '#818CF8', escalate: '#EF4444', pause: '#F59E0B' }[m] || '#6B7280');
  const modeLabel  = m => ({ ai: 'AI', escalate: 'Escalate', pause: 'Pause' }[m] || m);
  const statColor  = s => ({ active: '#22C55E', paused: '#F59E0B' }[s] || '#6B7280');

  // Create Rule modal
  const EMPTY_FORM = { name: '', trigger: 'new_lead', action: 'send_sms_ai', client_id: '', status: 'active' };
  const [showModal, setShowModal] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  function openModal() { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); }
  function closeModal() { setShowModal(false); }

  async function saveRule() {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!window.sb) { setFormError('No database connection.'); return; }
    setSaving(true);
    setFormError('');
    const { data, error } = await window.sb
      .from('automation_rules')
      .insert({
        name: form.name.trim(),
        trigger: form.trigger,
        action: form.action,
        client_id: form.client_id || null,
        status: form.status,
      })
      .select();
    setSaving(false);
    if (error) { setFormError(error.message || 'Failed to save rule.'); return; }
    if (data && data.length) setRules(prev => [...data, ...prev]);
    setShowModal(false);
  }

  async function toggleRule(rule) {
    if (!window.sb) return;
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    const { error } = await window.sb.from('automation_rules').update({ status: newStatus }).eq('id', rule.id);
    if (!error) setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
  }

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: T.t3, marginBottom: 6 };
  const fieldStyle = { width: '100%', padding: '9px 11px', fontSize: 13, color: T.t1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Automation Rules</h1>
          <div style={{ fontSize: 13, color: T.t3 }}>What should AI say, do, pause, or escalate?</div>
        </div>
        <button onClick={openModal}
          style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: T.accent, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
          + Create Rule
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
              <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 2 }}>{rule.name}</div>
              <div style={{ fontSize: 12, color: T.t4, display: 'flex', gap: 8 }}>
                <span>When: {rule.trigger}</span>
                <span>·</span>
                <span>Then: {rule.action}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: modeColor(rule.mode), background: modeColor(rule.mode) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                {modeLabel(rule.mode)}
              </span>
              <button onClick={() => toggleRule(rule)}
                style={{ fontSize: 11, fontWeight: 600, color: statColor(rule.status), background: statColor(rule.status) + '1A', padding: '2px 8px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {rule.status}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule modal */}
      {showModal && (
        <div onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 440, maxWidth: 'calc(100vw - 40px)', background: T.panel || T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.t1, letterSpacing: '-0.2px', margin: '0 0 18px 0' }}>Create Rule</h2>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name</label>
              <input type="text" value={form.name} placeholder="e.g. New lead instant reply"
                onChange={e => setForm({ ...form, name: e.target.value })} style={fieldStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Trigger</label>
              <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} style={fieldStyle}>
                <option value="new_lead">new_lead</option>
                <option value="followup_due">followup_due</option>
                <option value="enrolled">enrolled</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Action</label>
              <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} style={fieldStyle}>
                <option value="send_sms_ai">send_sms_ai</option>
                <option value="escalate">escalate</option>
                <option value="pause">pause</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Client</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={fieldStyle}>
                <option value="">All clients</option>
                {(clients || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.id}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['active', 'paused'].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, status: s })}
                    style={{ flex: 1, fontSize: 13, fontWeight: 600, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: form.status === s ? statColor(s) : T.t3,
                      background: form.status === s ? statColor(s) + '1A' : 'transparent',
                      border: `1px solid ${form.status === s ? statColor(s) : T.border}` }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {formError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 14 }}>{formError}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeModal} disabled={saving}
                style={{ fontSize: 13, fontWeight: 600, color: T.t2, background: 'transparent', padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={saveRule} disabled={saving}
                style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: T.accent, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AutomationRulesView = AutomationRulesView;
