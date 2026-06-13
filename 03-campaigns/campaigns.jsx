// 03-campaigns — Per landing-page funnel: filters + date range + click-through detail panel.
const RANGE_DAYS = { '7': 7, '30': 30, '90': 90, all: null };
const PROGRAM_COLOR = { Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' };
const statusLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

// ── Detail-panel charts ──────────────────────────────────────────────────────
function FunnelBars({ page, color, T }) {
  const stages = [
    { label: 'Views', value: page.views },
    { label: 'Clicks', value: page.clicks },
    { label: 'Leads', value: page.leads },
    { label: 'Trials', value: page.trials },
    { label: 'Enrolled', value: page.enrolled },
  ];
  const max = Math.max(page.views, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].value : null;
        const drop = prev != null ? (prev > 0 ? Math.round((s.value / prev) * 100) + '%' : '—') : null;
        const w = s.value > 0 ? Math.max((s.value / max) * 100, 2) : 0;
        return (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
              <span style={{ fontSize: 13, color: T.t4 }}>
                {drop != null && <span style={{ marginRight: 10 }}>{drop} of prev</span>}
                <span style={{ fontSize: 17, fontWeight: 700, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: T.hover || 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: w + '%', borderRadius: 5, background: color, transition: 'width .3s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConversionDonut({ page, color, T }) {
  const pct = page.views > 0 ? Math.round((page.enrolled / page.views) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: 116, height: 116, borderRadius: '50%', background: `conic-gradient(${color} ${pct * 3.6}deg, ${T.hover || 'rgba(255,255,255,0.06)'} 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 82, height: 82, borderRadius: '50%', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.6 }}>
          <strong style={{ color: T.t1 }}>{page.enrolled}</strong> enrolled from <strong style={{ color: T.t1 }}>{page.views}</strong> views
        </div>
        <div style={{ fontSize: 12, color: T.t4, marginTop: 4 }}>End-to-end conversion</div>
      </div>
    </div>
  );
}

function TrendChart({ page, color, T }) {
  const { useState, useEffect } = React;
  const [events, setEvents] = useState(null);

  useEffect(() => {
    if (!window.sb) { setEvents([]); return; }
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    window.sb.from('page_events').select('type,created_at')
      .eq('slug', page.rawSlug).eq('instrument', page.rawInstrument).gte('created_at', since)
      .then(({ data }) => setEvents(data || []), () => setEvents([]));
  }, [page.rawSlug, page.rawInstrument]);

  if (events === null) return <div style={{ fontSize: 13, color: T.t4 }}>Loading…</div>;

  const days = 30;
  const startDay = new Date(Date.now() - (days - 1) * 864e5); startDay.setHours(0, 0, 0, 0);
  const views = new Array(days).fill(0), clicks = new Array(days).fill(0);
  events.forEach(e => {
    const idx = Math.floor((new Date(e.created_at) - startDay) / 864e5);
    if (idx < 0 || idx >= days) return;
    if (e.type === 'view') views[idx]++; else if (e.type === 'signup_view') clicks[idx]++;
  });
  const totalV = views.reduce((a, b) => a + b, 0), totalC = clicks.reduce((a, b) => a + b, 0);
  const max = Math.max(...views, ...clicks, 1);
  const W = 300, H = 70, step = W / (days - 1);
  const line = arr => arr.map((v, i) => `${(i * step).toFixed(1)},${(H - (v / max) * H).toFixed(1)}`).join(' ');

  if (totalV === 0 && totalC === 0) {
    return <div style={{ fontSize: 13, color: T.t4 }}>No traffic in the last 30 days yet.</div>;
  }
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline points={line(views)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={line(clicks)} fill="none" stroke={T.t4} strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: 'flex', gap: 18, marginTop: 10, fontSize: 12, color: T.t3 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 2, background: color, display: 'inline-block' }} />Views ({totalV})</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, borderTop: `2px dashed ${T.t4}`, display: 'inline-block' }} />Clicks ({totalC})</span>
      </div>
    </div>
  );
}

function CampaignPanel({ page, T }) {
  const color = PROGRAM_COLOR[page.instrument] || '#6B7280';
  const section = { padding: '20px 24px', borderBottom: `1px solid ${T.border}` };
  const sectionLabel = { fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 };
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={section}><div style={sectionLabel}>Conversion</div><ConversionDonut page={page} color={color} T={T} /></div>
      <div style={section}><div style={sectionLabel}>Funnel</div><FunnelBars page={page} color={color} T={T} /></div>
      <div style={section}><div style={sectionLabel}>Last 30 days</div><TrendChart page={page} color={color} T={T} /></div>
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
function CampaignsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState, useMemo } = React;

  const [range, setRange] = useState('30');
  const [clientFilter, setClientFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const sinceMs = useMemo(() => RANGE_DAYS[range] ? Date.now() - RANGE_DAYS[range] * 864e5 : null, [range]);
  const allRows = window.usePageFunnel ? window.usePageFunnel(sinceMs) : [];

  const clientOpts = useMemo(() => {
    const m = {}; allRows.forEach(r => { if (r.client_id) m[r.client_id] = r.client_name; });
    return Object.entries(m).map(([id, name]) => ({ id, name }));
  }, [allRows]);
  const programOpts = useMemo(() => [...new Set(allRows.map(r => r.instrument))], [allRows]);
  const statusOpts = useMemo(() => [...new Set(allRows.map(r => r.status))], [allRows]);

  const rows = allRows.filter(r =>
    (clientFilter === 'all' || r.client_id === clientFilter) &&
    (programFilter === 'all' || r.instrument === programFilter) &&
    (statusFilter === 'all' || r.status === statusFilter));

  const tot = rows.reduce((a, r) => ({ views: a.views + r.views, clicks: a.clicks + r.clicks, leads: a.leads + r.leads, trials: a.trials + r.trials, enrolled: a.enrolled + r.enrolled }), { views: 0, clicks: 0, leads: 0, trials: 0, enrolled: 0 });
  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) + '%' : '—';
  const programColor = p => PROGRAM_COLOR[p] || '#6B7280';
  const statusColor = s => ({ live: '#22C55E', active: '#22C55E', paused: '#F59E0B', draft: '#6B7280', ended: '#6B7280' }[s] || '#6B7280');

  // resolve the open row against live data so the funnel/donut update in realtime
  const live = selected ? (allRows.find(r => r.id === selected.id) || selected) : null;

  const cell = { padding: '11px 16px', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const numCell = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const selectStyle = { background: T.surface, color: T.t2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, cursor: 'pointer', outline: 'none' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Campaigns</h1>
          <div style={{ fontSize: 13, color: T.t3 }}>Every landing page, from traffic to enrolled — which ones are producing?</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={selectStyle}>
            <option value="all">All clients</option>
            {clientOpts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} style={selectStyle}>
            <option value="all">All programs</option>
            {programOpts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All statuses</option>
            {statusOpts.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <select value={range} onChange={e => setRange(e.target.value)} style={selectStyle}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Summary metric band */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 24, paddingBottom: 20, marginBottom: 8, borderBottom: `1px solid ${T.border}` }}>
          {[
            { label: 'Views', value: tot.views },
            { label: 'Clicks', value: tot.clicks },
            { label: 'CTR', value: pct(tot.clicks, tot.views) },
            { label: 'Leads', value: tot.leads },
            { label: 'Trials', value: tot.trials },
            { label: 'Enrolled', value: tot.enrolled },
            { label: 'Conv', value: pct(tot.enrolled, tot.leads) },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Client', align: 'left' },
                { label: 'Program', align: 'left' },
                { label: 'Status', align: 'left' },
                { label: 'Views', align: 'right' },
                { label: 'Clicks', align: 'right' },
                { label: 'CTR', align: 'right' },
                { label: 'Leads', align: 'right' },
                { label: 'Trials', align: 'right' },
                { label: 'Enrolled', align: 'right' },
                { label: 'Conv', align: 'right' },
              ].map((h, i, arr) => (
                <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} style={{ cursor: 'pointer' }}
                onClick={() => setSelected(p)}
                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                <td style={firstCell}>
                  <div style={{ fontWeight: 500, color: T.t1 }}>{p.client_name}</div>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: programColor(p.instrument), background: programColor(p.instrument) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {p.instrument}
                  </span>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(p.status), background: statusColor(p.status) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {statusLabel(p.status)}
                  </span>
                </td>
                <td style={numCell}>{p.views}</td>
                <td style={numCell}>{p.clicks}</td>
                <td style={numCell}>{pct(p.clicks, p.views)}</td>
                <td style={numCell}>{p.leads}</td>
                <td style={numCell}>{p.trials}</td>
                <td style={numCell}>{p.enrolled}</td>
                <td style={lastCell}>{pct(p.enrolled, p.leads)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: T.t4, fontSize: 14 }}>No landing pages match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {live && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }} onClick={() => setSelected(null)} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: T.bg, borderLeft: `1px solid ${T.border}`, zIndex: 101, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, letterSpacing: '-0.2px' }}>{live.client_name}</div>
                <div style={{ fontSize: 12, color: T.t4, marginTop: 1 }}>{live.instrument} · /schools/{live.slug}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: T.t3, cursor: 'pointer', padding: 4, lineHeight: 0 }}>
                {L.X ? <L.X size={18} strokeWidth={1.75} /> : <span style={{ fontSize: 20 }}>×</span>}
              </button>
            </div>
            <CampaignPanel key={live.id} page={live} T={T} />
          </div>
        </>
      )}
    </div>
  );
}

window.CampaignsView = CampaignsView;
