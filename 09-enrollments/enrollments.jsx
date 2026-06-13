// 09-enrollments — What became revenue and what was lost?
function EnrollmentsView({ onNavigate }) {
  const T = window.T || {};
  const { useState } = React;
  const [clientId, setClientId] = useState(null);
  const { data: rawData } = useEnrollments(clientId ? { client_id: clientId } : undefined);
  const [enrollments, setEnrollments] = useState([]);
  React.useEffect(() => { if (rawData) setEnrollments(rawData); }, [rawData]);
  const [enrollingId, setEnrollingId] = useState(null);
  const [rateInput, setRateInput] = useState('');
  const [feeMap, setFeeMap] = useState({});       // tenant_id -> per-enrollment fee cents
  const [chargeMap, setChargeMap] = useState({}); // enrollment_id -> latest charge status
  const [charging, setCharging] = useState({});   // enrollment_id -> in-flight
  const [chargeMsg, setChargeMsg] = useState({}); // enrollment_id -> error/skip message

  // Load each client's fee + which enrollments are already charged (operator-gated endpoint).
  React.useEffect(() => {
    if (!window.sb || !enrollments.length) return;
    const clientIds = [...new Set(enrollments.map(e => e.client_id).filter(Boolean))];
    if (clientIds.length) {
      window.sb.from('agent_tenants').select('tenant_id, per_enrollment_fee_cents').in('tenant_id', clientIds)
        .then(({ data }) => {
          if (data) { const m = {}; data.forEach(t => { m[t.tenant_id] = t.per_enrollment_fee_cents; }); setFeeMap(m); }
        });
    }
    window.sb.functions.invoke('billing', { body: { action: 'charges' } }).then(({ data }) => {
      if (data && data.events) {
        const m = {};
        data.events.forEach(ev => { if (ev.enrollment_id && !m[ev.enrollment_id]) m[ev.enrollment_id] = ev.status; });
        setChargeMap(m);
      }
    });
  }, [enrollments]);

  async function chargeEnrollment(en) {
    if (!window.sb) return;
    setCharging(prev => ({ ...prev, [en.id]: true }));
    setChargeMsg(prev => ({ ...prev, [en.id]: '' }));
    const { data, error } = await window.sb.functions.invoke('billing', {
      body: { action: 'charge', tenant_id: en.client_id, enrollment_id: en.id },
    });
    setCharging(prev => ({ ...prev, [en.id]: false }));
    if (error || !data) { setChargeMsg(prev => ({ ...prev, [en.id]: 'Charge failed. Try again.' })); return; }
    if (data.ok || data.already_charged) {
      setChargeMap(prev => ({ ...prev, [en.id]: data.status || 'succeeded' }));
      return;
    }
    const reasonMap = {
      square_not_configured: 'Square not connected yet.',
      no_fee_configured: 'Set this client’s per-enrollment fee first.',
      no_card_on_file: 'School hasn’t added a card yet.',
    };
    const reason = data.reason || data.error || 'failed';
    setChargeMsg(prev => ({ ...prev, [en.id]: reasonMap[reason] || ('Charge ' + (data.status || 'failed') + (data.error ? ': ' + data.error : '')) }));
  }

  const outcomeColor = o => ({ enrolled: '#22C55E', lost: '#EF4444', follow_up: '#F59E0B', pending: '#6B7280' }[o] || '#6B7280');
  const outcomeLabel = o => ({ enrolled: 'Enrolled', lost: 'Lost', follow_up: 'Follow-up', pending: 'Pending' }[o] || o);
  const programColor = p => ({ Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' }[p] || '#6B7280');

  const enrolled = enrollments.filter(e => e.outcome === 'enrolled');
  const totalRevenue = enrolled.reduce((s, e) => s + (e.weekly_rate_cents || 0), 0);

  const green = T.isDark ? '#4ADE80' : '#15803D';

  const cell = { padding: '11px 16px', fontSize: 14, color: T.t2, borderBottom: `1px solid ${T.border}`, textAlign: 'left' };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0, textAlign: 'right' };

  async function confirmEnroll(en) {
    if (!window.sb) return;
    const weekly_rate_cents = Math.round(parseFloat(rateInput || '0') * 100);
    const enrolled_at = new Date().toISOString();
    const updates = { outcome: 'enrolled', enrolled_at, weekly_rate_cents };
    const { error } = await window.sb.from('enrollments').update(updates).eq('id', en.id);
    if (!error) {
      setEnrollments(prev => prev.map(e => e.id === en.id ? { ...e, ...updates } : e));
      setEnrollingId(null);
      setRateInput('');
      if (en.lead_id) {
        await window.sb.from('leads').update({ stage: 'enrolled' }).eq('id', en.lead_id);
      }
    }
  }

  async function recordLost(en) {
    if (!window.sb) return;
    const updates = { outcome: 'lost' };
    const { error } = await window.sb.from('enrollments').update(updates).eq('id', en.id);
    if (!error) {
      setEnrollments(prev => prev.map(e => e.id === en.id ? { ...e, ...updates } : e));
      if (en.lead_id) {
        await window.sb.from('leads').update({ stage: 'lost' }).eq('id', en.lead_id);
      }
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Enrollments</h1>
          <div style={{ fontSize: 13, color: T.t3 }}>What became revenue and what was lost?</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Weekly Revenue Added</div>
          <div style={{ fontSize: 29, fontWeight: 700, color: green, letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums' }}>
            ${(totalRevenue / 100).toFixed(0)}<span style={{ fontSize: 14, color: T.t3, fontWeight: 400 }}>/wk</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Parent / Student', 'Client', 'Program', 'Outcome', 'Weekly Rate', 'Date', ''].map((h, i, arr) => (
              <th key={h} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: T.t4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enrollments.map(e => (
            <tr key={e.id}
              onMouseEnter={r => { [...r.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
              onMouseLeave={r => { [...r.currentTarget.cells].forEach(td => td.style.background = 'transparent'); }}>
              <td style={firstCell}>
                <div style={{ fontWeight: 500, color: T.t1 }}>{e.parent_name}</div>
                <div style={{ fontSize: 12, color: T.t4 }}>{e.student_name}</div>
              </td>
              <td style={cell}>{e.client_name}</td>
              <td style={cell}>
                <span style={{ fontSize: 12, fontWeight: 600, color: programColor(e.program), background: programColor(e.program) + '1A', padding: '2px 7px', borderRadius: 20 }}>
                  {e.program}
                </span>
              </td>
              <td style={cell}>
                <span style={{ fontSize: 12, fontWeight: 600, color: outcomeColor(e.outcome), background: outcomeColor(e.outcome) + '1A', padding: '2px 8px', borderRadius: 20 }}>
                  {outcomeLabel(e.outcome)}
                </span>
              </td>
              <td style={cell}>
                {e.weekly_rate_cents ? '$' + (e.weekly_rate_cents / 100).toFixed(0) + '/wk' : <span style={{ color: T.t4 }}>—</span>}
              </td>
              <td style={cell}>{e.enrolled_at || <span style={{ color: T.t4 }}>—</span>}</td>
              <td style={lastCell}>
                {(e.outcome === 'pending' || e.outcome === 'follow_up') && enrollingId !== e.id && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEnrollingId(e.id); setRateInput(''); }}
                      style={{ padding: '3px 10px', border: '1px solid #22C55E40', borderRadius: 6, background: '#22C55E0D', fontSize: 12, color: '#22C55E', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Enrolled
                    </button>
                    <button onClick={() => recordLost(e)}
                      style={{ padding: '3px 10px', border: '1px solid #EF444440', borderRadius: 6, background: '#EF44440D', fontSize: 12, color: '#EF4444', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lost
                    </button>
                  </div>
                )}
                {enrollingId === e.id && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="$/wk"
                      value={rateInput}
                      onChange={ev => setRateInput(ev.target.value)}
                      style={{ width: 70, padding: '3px 7px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg2 || 'transparent', color: T.t1, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <button onClick={() => confirmEnroll(e)}
                      style={{ padding: '3px 10px', border: '1px solid #22C55E40', borderRadius: 6, background: '#22C55E0D', fontSize: 12, color: '#22C55E', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Confirm
                    </button>
                    <button onClick={() => { setEnrollingId(null); setRateInput(''); }}
                      style={{ padding: '3px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'transparent', fontSize: 12, color: T.t3, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Cancel
                    </button>
                  </div>
                )}
                {e.outcome === 'enrolled' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {(chargeMap[e.id] === 'succeeded' || chargeMap[e.id] === 'pending') ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#22C55E' }}>
                        Charged{chargeMap[e.id] === 'pending' ? ' (pending)' : ''}
                      </span>
                    ) : (
                      <button onClick={() => chargeEnrollment(e)} disabled={!!charging[e.id]}
                        style={{ padding: '3px 10px', border: `1px solid ${T.accent}55`, borderRadius: 6, background: `${T.accent}14`, fontSize: 12, color: T.accent, cursor: charging[e.id] ? 'not-allowed' : 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: charging[e.id] ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                        {charging[e.id] ? 'Charging…' : (feeMap[e.client_id] ? 'Charge $' + (feeMap[e.client_id] / 100).toFixed(0) : 'Charge')}
                      </button>
                    )}
                    {chargeMsg[e.id] && <span style={{ fontSize: 11, color: '#EF4444', maxWidth: 170, textAlign: 'right' }}>{chargeMsg[e.id]}</span>}
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

window.EnrollmentsView = EnrollmentsView;
