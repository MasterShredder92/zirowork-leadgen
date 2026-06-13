window.PortalBilling = function PortalBilling({ tenantId }) {
  const FN_URL = 'https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/billing';

  const [status, setStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [adding, setAdding] = React.useState(false);     // card-entry form is open
  const [cardError, setCardError] = React.useState('');
  const [startingSetup, setStartingSetup] = React.useState(false);
  const [savingCard, setSavingCard] = React.useState(false);
  const cardDivRef = React.useRef(null);
  const sqRef = React.useRef(null); // { payments, card }

  async function callBilling(payload) {
    const token = (await window.sb.auth.getSession()).data.session.access_token;
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function loadStatus() {
    if (tenantId === 'preview') {
      const day = 86400000;
      setStatus({
        configured: true,
        card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2027 },
        per_enrollment_fee_cents: 15000,
        events: [
          { id: 'p1', description: 'Enrollment — Mia Torres (Piano)', amount_cents: 15000, status: 'succeeded', created_at: new Date(Date.now() - 2 * day).toISOString() },
          { id: 'p2', description: 'Enrollment — Jake Lund (Guitar)', amount_cents: 15000, status: 'succeeded', created_at: new Date(Date.now() - 6 * day).toISOString() },
          { id: 'p3', description: 'Enrollment — Ava Chen (Voice)', amount_cents: 15000, status: 'pending', created_at: new Date(Date.now() - 9 * day).toISOString() },
        ],
      });
      setLoading(false);
      return;
    }
    try {
      const data = await callBilling({ action: 'status', tenant_id: tenantId });
      setStatus(data);
    } catch (e) {
      setLoadError(e.message);
    }
    setLoading(false);
  }

  React.useEffect(() => { loadStatus(); }, [tenantId]);

  // Load Square's Web Payments SDK for the right environment (sandbox vs production).
  function loadSquareJs(environment) {
    const src = environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';
    return new Promise((resolve, reject) => {
      if (window.Square) return resolve();
      let el = document.getElementById('zw-square-js');
      if (!el) {
        el = document.createElement('script');
        el.id = 'zw-square-js';
        el.src = src;
        document.head.appendChild(el);
      }
      el.addEventListener('load', () => resolve());
      el.addEventListener('error', () => reject(new Error('Could not load Square.')));
    });
  }

  async function handleAddCard() {
    setCardError('');
    if (tenantId === 'preview') { setCardError('Card setup is disabled in preview mode.'); return; }
    if (!status.application_id || !status.location_id) { setCardError('Billing is not configured yet.'); return; }
    setStartingSetup(true);
    try {
      await loadSquareJs(status.environment);
      const payments = window.Square.payments(status.application_id, status.location_id);
      const card = await payments.card();
      sqRef.current = { payments, card };
      setAdding(true); // renders the container; attach happens in the effect below
    } catch (e) {
      setCardError(e.message);
    }
    setStartingSetup(false);
  }

  // Mount the Square card element once the entry form is on screen.
  React.useEffect(() => {
    if (!adding || !sqRef.current || !cardDivRef.current) return;
    let cancelled = false;
    sqRef.current.card.attach(cardDivRef.current).catch(e => { if (!cancelled) setCardError(e.message); });
    return () => { cancelled = true; };
  }, [adding]);

  function teardownCard() {
    if (sqRef.current && sqRef.current.card) {
      try { sqRef.current.card.destroy(); } catch (e) {}
    }
    sqRef.current = null;
  }

  async function handleSaveCard() {
    if (!sqRef.current) return;
    setSavingCard(true);
    setCardError('');
    try {
      const result = await sqRef.current.card.tokenize();
      if (result.status !== 'OK') {
        throw new Error((result.errors && result.errors[0] && result.errors[0].message) || 'Could not read card.');
      }
      await callBilling({ action: 'add-card', tenant_id: tenantId, source_id: result.token });
      teardownCard();
      setAdding(false);
      setLoading(true);
      await loadStatus();
    } catch (e) {
      setCardError(e.message);
    }
    setSavingCard(false);
  }

  function fmtMoney(cents) { return '$' + (cents / 100).toFixed(2); }
  function fmtRate(cents) { const n = cents / 100; return '$' + (Number.isInteger(n) ? n : n.toFixed(2)); }
  function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function brandName(b) { return b ? b.charAt(0).toUpperCase() + b.slice(1).toLowerCase() : 'Card'; }

  const chipColors = {
    succeeded: { bg: '#D1F4E8', fg: '#034636' },
    failed:    { bg: '#FCE2E2', fg: '#7A1C1C' },
  };

  const s = {
    page: { padding: '32px 36px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.2s ease' },
    heading: { fontSize: 23, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--t1)', marginBottom: 4 },
    sub: { fontSize: 14, color: 'var(--t3)', marginBottom: 28 },
    section: { marginBottom: 32 },
    sectionHead: { paddingBottom: 10, marginBottom: 18, borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' },
    emptyText: { fontSize: 14, color: 'var(--t3)' },
    cardRow: { display: 'flex', alignItems: 'center', gap: 12 },
    cardBrand: { fontSize: 14, fontWeight: 600, color: 'var(--t1)' },
    cardExp: { fontSize: 13, color: 'var(--t4)' },
    btn: (disabled) => ({ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: 'inherit' }),
    ghostBtn: { padding: '9px 20px', background: 'transparent', color: 'var(--t2)', border: '1px solid var(--bmed)', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    cardElWrap: { padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--bmed)', borderRadius: 7, marginBottom: 14, maxWidth: 480 },
    errorText: { fontSize: 13, color: '#B42318', fontWeight: 600, marginTop: 10 },
    feeLine: { fontSize: 14, color: 'var(--t2)', marginTop: 14 },
    feeStrong: { fontWeight: 700, color: 'var(--t1)' },
    histItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' },
    histDesc: { fontSize: 14, fontWeight: 600, color: 'var(--t1)' },
    histDate: { fontSize: 12, color: 'var(--t4)', marginTop: 1 },
    histAmount: { fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginLeft: 'auto', flexShrink: 0 },
    chip: (st) => ({ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0, background: (chipColors[st] || {}).bg || 'var(--hover)', color: (chipColors[st] || {}).fg || 'var(--t3)' }),
  };

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--t3)', fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (loadError) return (
    <div style={s.page}>
      <div style={s.heading}>Billing</div>
      <div style={{ ...s.emptyText, marginTop: 8 }}>Couldn't load billing: {loadError}</div>
    </div>
  );

  if (!status || !status.configured) return (
    <div style={s.page}>
      <div style={s.heading}>Billing</div>
      <div style={s.sub}>Card on file — you're only charged when we hand you an enrolled student.</div>
      <div style={s.emptyText}>Billing isn't activated yet — nothing to set up.</div>
    </div>
  );

  const events = status.events || [];

  return (
    <div style={s.page}>
      <div style={s.heading}>Billing</div>
      <div style={s.sub}>Card on file — you're only charged when we hand you an enrolled student.</div>

      <div style={s.section}>
        <div style={s.sectionHead}>Card on File</div>

        {adding ? (
          <div>
            <div style={s.cardElWrap}>
              <div ref={cardDivRef} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s.btn(savingCard)} onClick={handleSaveCard} disabled={savingCard}>
                {savingCard ? 'Saving…' : 'Save card'}
              </button>
              <button style={s.ghostBtn} onClick={() => { teardownCard(); setAdding(false); setCardError(''); }}>Cancel</button>
            </div>
          </div>
        ) : status.card ? (
          <div style={s.cardRow}>
            <div>
              <div style={s.cardBrand}>{brandName(status.card.brand)} •••• {status.card.last4}</div>
              <div style={s.cardExp}>Expires {String(status.card.exp_month).padStart(2, '0')}/{String(status.card.exp_year).slice(-2)}</div>
            </div>
            <button style={s.ghostBtn} onClick={handleAddCard} disabled={startingSetup}>
              {startingSetup ? 'Loading…' : 'Replace card'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ ...s.emptyText, marginBottom: 12 }}>No card on file yet.</div>
            <button style={s.btn(startingSetup)} onClick={handleAddCard} disabled={startingSetup}>
              {startingSetup ? 'Loading…' : 'Add card'}
            </button>
          </div>
        )}

        {cardError && <div style={s.errorText}>{cardError}</div>}

        {!!status.per_enrollment_fee_cents && (
          <div style={s.feeLine}>
            Your rate: <span style={s.feeStrong}>{fmtRate(status.per_enrollment_fee_cents)}</span> per enrolled student
          </div>
        )}
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>Charge History</div>
        {events.length === 0 ? (
          <div style={s.emptyText}>No charges yet.</div>
        ) : (
          events.map(ev => (
            <div key={ev.id} style={s.histItem}>
              <div>
                <div style={s.histDesc}>{ev.description || 'Charge'}</div>
                <div style={s.histDate}>{fmtDate(ev.created_at)}</div>
              </div>
              <div style={s.histAmount}>{fmtMoney(ev.amount_cents)}</div>
              <div style={s.chip(ev.status)}>{ev.status}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
