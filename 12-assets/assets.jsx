// 12-assets — What logos, photos, teacher bios, testimonials, offers, and brand voice are available?
function AssetsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};

  const { data: rawData } = window.useAssets ? window.useAssets() : { data: [] };
  const [assets, setAssets] = React.useState([]);
  React.useEffect(() => { if (rawData) setAssets(rawData); }, [rawData]);

  const [filter, setFilter] = React.useState('all');
  const types = ['all', 'Logo', 'Teacher Bio', 'Offer', 'Testimonial', 'Brand Voice'];

  const statusColor = s => ({ ready: '#22C55E', missing: '#EF4444', draft: '#F59E0B' }[s] || '#6B7280');
  const nextStatus = s => ({ missing: 'draft', draft: 'ready', ready: 'missing' }[s] || 'draft');

  async function cycleStatus(asset) {
    if (!window.sb) return;
    const status = nextStatus(asset.status);
    const { error } = await window.sb.from('assets').update({ status }).eq('id', asset.id);
    if (!error) setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status } : a));
  }

  const typeIcon    = t => {
    if (!L) return null;
    const icons = { Logo: L.Image, 'Teacher Bio': L.User, Offer: L.Tag, Testimonial: L.Star, 'Brand Voice': L.MessageSquare };
    const Icon = icons[t] || L.File;
    return Icon ? <Icon size={14} /> : null;
  };

  const filtered = filter === 'all' ? assets : assets.filter(a => a.type === filter);
  const cell = { padding: '12px 0', fontSize: 13, color: T.t2, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Assets</h1>
          <div style={{ fontSize: 12, color: T.t3 }}>What logos, photos, teacher bios, testimonials, offers, and brand voice are available?</div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Upload && <L.Upload size={14} strokeWidth={1.75} />} Upload
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {types.map(t => {
          const active = filter === t;
          return (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: active ? 'none' : `1px solid ${T.border}`, background: active ? T.accent : 'transparent', color: active ? '#fff' : T.t3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t}
            </button>
          );
        })}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Client', 'Type', 'Name', 'Status'].map(h => (
              <th key={h} style={{ ...cell, color: T.t4, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.id}
              onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
              onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
              <td style={cell}><div style={{ fontWeight: 500, color: T.t1 }}>{a.client_name}</div></td>
              <td style={cell}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.t3 }}>
                  {typeIcon(a.type)}
                  <span style={{ fontSize: 12 }}>{a.type}</span>
                </div>
              </td>
              <td style={cell}>{a.name}</td>
              <td style={cell}>
                <button onClick={() => cycleStatus(a)}
                  style={{ fontSize: 11, fontWeight: 600, color: statusColor(a.status), background: statusColor(a.status) + '1A', padding: '2px 8px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {a.status}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

window.AssetsView = AssetsView;
