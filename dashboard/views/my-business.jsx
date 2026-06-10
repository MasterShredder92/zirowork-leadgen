window.PortalMyBusiness = function PortalMyBusiness({ tenantId }) {
  const [data, setData] = React.useState(null);
  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      if (tenantId === 'preview') {
        const sample = {
          name: 'Maple Street Music',
          plan_tier: 'studio',
          status: 'active',
          config: {
            director_name: 'Dana Reyes',
            director_title: 'Owner',
            location_name: 'Main Studio',
            monthly_price_standard: 160,
            monthly_price_military: 140,
          },
        };
        setData(sample);
        setForm({
          name: sample.name,
          director_name: sample.config.director_name,
          location_name: sample.config.location_name,
          director_title: sample.config.director_title,
          monthly_price_standard: sample.config.monthly_price_standard,
          monthly_price_military: sample.config.monthly_price_military,
        });
        setLoading(false);
        return;
      }

      const { data: tenant } = await window.sb
        .from('agent_tenants')
        .select('name, plan_tier, status, config')
        .eq('tenant_id', tenantId)
        .single();

      if (tenant) {
        setData(tenant);
        setForm({
          name: tenant.name || '',
          director_name: tenant.config?.director_name || '',
          location_name: tenant.config?.location_name || '',
          director_title: tenant.config?.director_title || '',
          monthly_price_standard: tenant.config?.monthly_price_standard ?? '',
          monthly_price_military: tenant.config?.monthly_price_military ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const newConfig = {
      ...data.config,
      director_name: form.director_name,
      location_name: form.location_name,
      director_title: form.director_title,
      monthly_price_standard: Number(form.monthly_price_standard) || 0,
      monthly_price_military: Number(form.monthly_price_military) || 0,
    };

    await window.sb
      .from('agent_tenants')
      .update({ name: form.name, config: newConfig, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const s = {
    page: { padding: '32px 36px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.2s ease' },
    heading: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--t1)', marginBottom: 4 },
    sub: { fontSize: 13, color: 'var(--t3)', marginBottom: 28 },
    section: { marginBottom: 32 },
    sectionHead: {
      paddingBottom: 10, marginBottom: 18, borderBottom: '1px solid var(--border)',
      fontSize: 11, fontWeight: 700, color: 'var(--t3)',
      letterSpacing: '0.08em', textTransform: 'uppercase',
    },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
    fieldWrap: { marginBottom: 14 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 5 },
    input: {
      width: '100%', padding: '9px 12px',
      background: 'var(--bg)', border: '1px solid var(--bmed)',
      borderRadius: 7, fontSize: 13, color: 'var(--t1)',
      outline: 'none', fontFamily: 'inherit',
    },
    priceWrap: {
      display: 'flex', alignItems: 'center',
      background: 'var(--bg)', border: '1px solid var(--bmed)',
      borderRadius: 7, overflow: 'hidden',
    },
    priceSymbol: {
      padding: '9px 10px 9px 12px', fontSize: 13, color: 'var(--t3)', flexShrink: 0,
    },
    priceInput: {
      flex: 1, padding: '9px 12px 9px 2px', background: 'transparent',
      border: 'none', fontSize: 13, color: 'var(--t1)', outline: 'none',
      fontFamily: 'inherit',
    },
    chipRow: { display: 'flex', gap: 8, marginBottom: 20 },
    chip: (active) => ({
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: active ? 'var(--accent-bg)' : 'var(--bg)',
      color: active ? 'var(--accent)' : 'var(--t4)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    }),
    actions: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 },
    saveBtn: {
      padding: '9px 22px', background: 'var(--accent)', color: '#fff',
      border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
      fontFamily: 'inherit',
    },
    savedMsg: { fontSize: 12, color: '#059669', fontWeight: 600 },
  };

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--t3)', fontSize: 13 }}>Loading…</div>
    </div>
  );

  if (!form) return (
    <div style={s.page}>
      <div style={s.heading}>My Business</div>
      <div style={{ color: 'var(--t3)', fontSize: 13, marginTop: 8 }}>No business profile found.</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.heading}>My Business</div>
      <div style={s.sub}>This information powers your AI agent. Keep it current.</div>

      <div style={s.chipRow}>
        <div style={s.chip(data.status === 'active')}>● Active</div>
        <div style={s.chip(false)}>{data.plan_tier || 'individual'} plan</div>
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>School Info</div>
        <div style={s.grid2}>
          <div style={s.fieldWrap}>
            <label style={s.label}>School Name</label>
            <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Location Name</label>
            <input style={s.input} value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="e.g. Main Campus" />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Director / Owner Name</label>
            <input style={s.input} value={form.director_name} onChange={e => set('director_name', e.target.value)} />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Title</label>
            <input style={s.input} value={form.director_title} onChange={e => set('director_title', e.target.value)} placeholder="e.g. Owner" />
          </div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>Pricing</div>
        <div style={s.grid2}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Standard / month</label>
            <div style={s.priceWrap}>
              <span style={s.priceSymbol}>$</span>
              <input
                style={s.priceInput}
                type="number"
                value={form.monthly_price_standard}
                onChange={e => set('monthly_price_standard', e.target.value)}
                placeholder="160"
              />
            </div>
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Military discount / month</label>
            <div style={s.priceWrap}>
              <span style={s.priceSymbol}>$</span>
              <input
                style={s.priceInput}
                type="number"
                value={form.monthly_price_military}
                onChange={e => set('monthly_price_military', e.target.value)}
                placeholder="140"
              />
            </div>
          </div>
        </div>
      </div>

      <div style={s.actions}>
        <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <div style={s.savedMsg}>✓ Saved — your agent is updated</div>}
      </div>
    </div>
  );
};
