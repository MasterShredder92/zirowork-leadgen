// 08-bookings — What has ZiroWork scheduled and is the lead enrolled?
function BookingsView({ onNavigate }) {
  const T = window.T || {};
  const { useState } = React;
  const [clientId, setClientId] = useState(null);
  const { data: rawData } = useBookings(clientId ? { client_id: clientId } : undefined);
  const [bookings, setBookings] = useState([]);
  React.useEffect(() => { if (rawData) setBookings(rawData); }, [rawData]);

  const statusColor = s => ({ scheduled: '#22C55E', requested: '#3B82F6', completed: '#6B7280', no_show: '#EF4444' }[s] || '#6B7280');
  const statusLabel = s => ({ scheduled: 'Scheduled', requested: 'Requested', completed: 'Completed', no_show: 'No-Show' }[s] || '—');
  const programColor = p => ({ Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' }[p] || '#6B7280');

  const cell = { padding: '11px 16px', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0 };

  async function markBooking(id, status) {
    if (!window.sb) return;
    const { error } = await window.sb.from('bookings').update({ status }).eq('id', id);
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Bookings</h1>
        <div style={{ fontSize: 13, color: T.t3 }}>What has ZiroWork scheduled and is the lead enrolled?</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Parent / Student', align: 'left' },
                { label: 'Client', align: 'left' },
                { label: 'Program', align: 'left' },
                { label: 'Status', align: 'left' },
                { label: 'Date', align: 'left' },
                { label: 'Time', align: 'left' },
                { label: 'Teacher', align: 'left' },
                { label: '', align: 'right' },
              ].map((h, i, arr) => (
                <th key={i} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}
                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
                onMouseLeave={e => { [...e.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
                <td style={firstCell}>
                  <div style={{ fontWeight: 500, color: T.t1 }}>{b.parent_name}</div>
                  <div style={{ fontSize: 12, color: T.t4 }}>{b.student_name}</div>
                </td>
                <td style={cell}>{b.client_name}</td>
                <td style={cell}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: programColor(b.program), background: programColor(b.program) + '1A', padding: '2px 7px', borderRadius: 20 }}>
                    {b.program}
                  </span>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(b.status), background: statusColor(b.status) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                    {statusLabel(b.status)}
                  </span>
                </td>
                <td style={cell}>{b.date || <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={cell}>{b.time || <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={cell}>{b.teacher || <span style={{ color: T.t4 }}>—</span>}</td>
                <td style={lastCell}>
                  {b.status !== 'completed' && b.status !== 'no_show' && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => markBooking(b.id, 'completed')}
                        style={{ padding: '3px 10px', border: '1px solid #22C55E40', borderRadius: 6, background: '#22C55E0D', fontSize: 12, color: '#22C55E', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Completed
                      </button>
                      <button onClick={() => markBooking(b.id, 'no_show')}
                        style={{ padding: '3px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'none', fontSize: 12, color: T.t3, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        No-Show
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.BookingsView = BookingsView;
