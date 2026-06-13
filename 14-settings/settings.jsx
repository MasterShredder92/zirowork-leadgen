// 14-settings — ZiroWork operator settings
const SEND_WINDOW_DEFAULTS = { send_window_start_hour: 9, send_window_end_hour: 21, send_window_tz: 'America/Chicago', max_followups: 3, followup_day_offsets: [2, 4, 7] };
const TZ_OPTIONS = ['America/Chicago', 'America/New_York', 'America/Denver', 'America/Los_Angeles'];

function SettingsView({ onNavigate }) {
  const T = window.T || {};
  const operator = window.currentOperator || {};
  const user = window.currentUser || {};

  // Speed-to-Lead — per-tenant send cadence stored in agent_tenants.config
  const [tenants, setTenants] = React.useState(null); // null = loading, [] = none/no sb
  const [selectedId, setSelectedId] = React.useState(null);
  const [cadence, setCadence] = React.useState(SEND_WINDOW_DEFAULTS);
  const [offsetsText, setOffsetsText] = React.useState('2, 4, 7');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!window.sb) { setTenants([]); return; }
      const { data, error } = await window.sb.from('agent_tenants').select('tenant_id, name, config').order('name');
      if (!alive) return;
      if (error || !data) { setTenants([]); return; }
      setTenants(data);
      if (data.length) setSelectedId(data[0].tenant_id);
    })();
    return () => { alive = false; };
  }, []);

  // When the selected tenant changes, load its config into the editable fields
  React.useEffect(() => {
    if (!tenants || !selectedId) return;
    const t = tenants.find(x => x.tenant_id === selectedId);
    const cfg = (t && t.config) || {};
    const c = {
      send_window_start_hour: cfg.send_window_start_hour ?? SEND_WINDOW_DEFAULTS.send_window_start_hour,
      send_window_end_hour: cfg.send_window_end_hour ?? SEND_WINDOW_DEFAULTS.send_window_end_hour,
      send_window_tz: cfg.send_window_tz ?? SEND_WINDOW_DEFAULTS.send_window_tz,
      max_followups: cfg.max_followups ?? SEND_WINDOW_DEFAULTS.max_followups,
      followup_day_offsets: Array.isArray(cfg.followup_day_offsets) ? cfg.followup_day_offsets : SEND_WINDOW_DEFAULTS.followup_day_offsets,
    };
    setCadence(c);
    setOffsetsText(c.followup_day_offsets.join(', '));
    setSaved(false); setSaveErr('');
  }, [tenants, selectedId]);

  async function saveCadence() {
    if (!window.sb || !selectedId || !tenants) return;
    setSaving(true); setSaved(false); setSaveErr('');
    const t = tenants.find(x => x.tenant_id === selectedId);
    const existing = (t && t.config) || {};
    const offsets = offsetsText.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    const newConfig = {
      ...existing,
      send_window_start_hour: Number(cadence.send_window_start_hour),
      send_window_end_hour: Number(cadence.send_window_end_hour),
      send_window_tz: cadence.send_window_tz,
      max_followups: Number(cadence.max_followups),
      followup_day_offsets: offsets,
    };
    const { error } = await window.sb.from('agent_tenants').update({ config: newConfig, updated_at: new Date().toISOString() }).eq('tenant_id', selectedId);
    setSaving(false);
    if (error) { setSaveErr('Save failed: ' + error.message); return; }
    setTenants(prev => prev.map(x => x.tenant_id === selectedId ? { ...x, config: newConfig } : x));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const selectStyle = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.bg, fontSize: 13, color: T.t1, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const inputStyle = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.bg, fontSize: 13, color: T.t1, fontFamily: "'Plus Jakarta Sans', sans-serif" };

  const FieldRow = ({ label, control, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${T.border}`, gap: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.t1 }}>{label}</div>
      {control}
    </div>
  );

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
        {tenants === null ? (
          <div style={{ fontSize: 13, color: T.t4, padding: '14px 0' }}>Loading…</div>
        ) : tenants.length === 0 ? (
          <div style={{ fontSize: 13, color: T.t4, padding: '14px 0' }}>Not connected to Supabase — send cadence settings are unavailable.</div>
        ) : (
          <>
            {tenants.length > 1 ? (
              <FieldRow label="School" control={
                <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)} style={selectStyle}>
                  {tenants.map(t => <option key={t.tenant_id} value={t.tenant_id}>{t.name || t.tenant_id}</option>)}
                </select>
              } />
            ) : (
              <Row label="School" value={(tenants[0] && (tenants[0].name || tenants[0].tenant_id)) || ''} />
            )}
            <FieldRow label="Contact window start hour" control={
              <select value={cadence.send_window_start_hour} onChange={e => setCadence(c => ({ ...c, send_window_start_hour: e.target.value }))} style={selectStyle}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}</option>)}
              </select>
            } />
            <FieldRow label="Contact window end hour" control={
              <select value={cadence.send_window_end_hour} onChange={e => setCadence(c => ({ ...c, send_window_end_hour: e.target.value }))} style={selectStyle}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}</option>)}
              </select>
            } />
            <FieldRow label="Timezone" control={
              <select value={cadence.send_window_tz} onChange={e => setCadence(c => ({ ...c, send_window_tz: e.target.value }))} style={selectStyle}>
                {TZ_OPTIONS.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            } />
            <FieldRow label="Max follow-ups" control={
              <input type="number" min={1} max={5} value={cadence.max_followups} onChange={e => setCadence(c => ({ ...c, max_followups: e.target.value }))} style={{ ...inputStyle, width: 70 }} />
            } />
            <FieldRow label="Follow-up day offsets" control={
              <input type="text" value={offsetsText} onChange={e => setOffsetsText(e.target.value)} placeholder="2, 4, 7" style={{ ...inputStyle, width: 140 }} />
            } last />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 16 }}>
              <button onClick={saveCadence} disabled={saving}
                style={{ padding: '7px 16px', border: 'none', borderRadius: 7, background: T.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && <div style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✓ Saved</div>}
              {saveErr && <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>{saveErr}</div>}
            </div>
          </>
        )}
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
