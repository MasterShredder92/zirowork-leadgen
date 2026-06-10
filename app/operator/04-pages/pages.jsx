// 04-pages — Which landing pages and signup pages are draft, ready, live, or broken?
function PagesView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};

  const { data: pages } = window.usePages ? window.usePages() : { data: [] };

  const [filter, setFilter] = React.useState('all');
  const statuses = ['all', 'live', 'draft', 'broken'];

  const statusColor = s => ({ live: '#22C55E', draft: '#F59E0B', broken: '#EF4444' }[s] || '#6B7280');
  const statusLabel = s => ({ live: 'Live', draft: 'Draft', broken: 'Broken' }[s] || s);
  const programColor = p => ({ Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' }[p] || '#6B7280');

  const filtered = filter === 'all' ? pages : pages.filter(p => p.status === filter);
  const cell = { padding: '12px 14px', fontSize: 13, color: 'var(--text-2)', borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', marginBottom: 4 }}>Pages</div>
          <div style={{ fontSize: 13, color: T.t3 }}>Which landing pages and signup pages are draft, ready, live, or broken?</div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {L.Plus && <L.Plus size={14} />} New Page
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {statuses.map(s => {
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: active ? 'none' : `1px solid ${T.border}`, background: active ? T.accent : 'transparent', color: active ? '#fff' : T.t3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s === 'all' ? 'All' : statusLabel(s)}
            </button>
          );
        })}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Client', 'Program', 'Type', 'Status', 'Slug', 'Updated'].map(h => (
              <th key={h} style={{ ...cell, color: T.t4, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(pg => (
            <tr key={pg.id}
              onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
              onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
              <td style={cell}><div style={{ fontWeight: 500, color: T.t1 }}>{pg.client_name}</div></td>
              <td style={cell}>
                <span style={{ fontSize: 11, fontWeight: 600, color: programColor(pg.program), background: programColor(pg.program) + '1A', padding: '2px 8px', borderRadius: 20 }}>{pg.program}</span>
              </td>
              <td style={cell}><span style={{ fontSize: 11, color: T.t3 }}>{pg.type}</span></td>
              <td style={cell}>
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor(pg.status), background: statusColor(pg.status) + '1A', padding: '2px 8px', borderRadius: 20 }}>{statusLabel(pg.status)}</span>
              </td>
              <td style={cell}><code style={{ fontSize: 11, color: T.t3 }}>{pg.slug}</code></td>
              <td style={cell}>{pg.last_updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

window.PagesView = PagesView;
