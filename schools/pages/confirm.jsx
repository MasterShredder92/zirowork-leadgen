// confirm.jsx — Enrollment confirmation page.
// The flagship "enrolled" trigger: a student clicks their unique link, sees the
// specific time they were offered, and taps Confirm. That click is the proof —
// it stamps bookings.confirmed_at, creates the enrollments row, advances the
// lead to 'enrolled', and hands the student off to the school (handed_off_at).
function ConfirmPage({ school, client, slug }) {
  const accent = school.accent || '#E04D27';
  const { useState, useEffect } = React;
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | confirming | done | notfound | already
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) { setStatus('notfound'); return; }
    (async () => {
      const { data } = await window.sb.from('bookings').select('*').eq('confirmation_token', token).limit(1);
      const b = data && data[0];
      if (!b) { setStatus('notfound'); return; }
      setBooking(b);
      setStatus(b.confirmed_at ? 'already' : 'ready');
    })();
  }, []);

  const prettyDate = (d) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  async function confirm() {
    if (!booking) return;
    setStatus('confirming'); setErr('');
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const inst = (booking.program || '').split(',')[0].trim();
    const prices = client && client.program_prices;
    const entry = prices && (prices[inst] || Object.values(prices)[0]);
    const rateCents = entry && entry.price ? Math.round(parseFloat(entry.price) * 100) : null;

    const { error: bErr } = await window.sb.from('bookings')
      .update({ status: 'confirmed', confirmed_at: now })
      .eq('id', booking.id);

    const { data: enrRows, error: eErr } = await window.sb.from('enrollments').insert([{
      booking_id: booking.id,
      lead_id: booking.lead_id,
      client_id: (client && client.id) || null,
      client_name: school.name,
      student_name: booking.student_name,
      parent_name: booking.parent_name,
      program: booking.program,
      outcome: 'enrolled',
      enrolled_at: today,
      weekly_rate_cents: rateCents,
      handed_off_at: now,
    }]).select();

    if (booking.lead_id) {
      await window.sb.from('leads').update({ stage: 'enrolled' }).eq('id', booking.lead_id);
    }

    if (bErr || eErr) {
      setErr('Something went wrong confirming your spot. Please call the studio.');
      setStatus('ready');
      return;
    }

    // Notify the school that a student enrolled. The SMS must run server-side
    // (Twilio secrets), so we hand off to the enrollment-handoff edge function.
    // The enrollment already succeeded, so a failed text never blocks the parent —
    // but the function records the outcome to ziro_events so it's never silent.
    const enrolled = enrRows && enrRows[0];
    if (enrolled && enrolled.client_id) {
      try {
        const resp = await fetch('https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/enrollment-handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollment_id: enrolled.id, client_id: enrolled.client_id }),
        });
        if (!resp.ok) console.error('enrollment-handoff failed:', resp.status, await resp.text());
      } catch (e) {
        console.error('enrollment-handoff error:', e);
      }
    }

    setStatus('done');
  }

  const wrap = {
    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#fff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    padding: '40px 24px', textAlign: 'center',
  };
  const badge = {
    display: 'inline-block', background: accent + '18', color: accent, padding: '3px 14px',
    borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: 28,
  };

  if (status === 'loading') {
    return <div style={wrap}><div style={{ color: '#aaa', fontSize: 15 }}>Loading your details…</div></div>;
  }

  if (status === 'notfound') {
    return (
      <div style={wrap}>
        <div style={badge}>{school.name}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: '#1a1a1a', margin: '0 0 12px' }}>Link not found</h1>
        <p style={{ fontSize: 16, color: '#888', maxWidth: 380, lineHeight: 1.6 }}>
          This confirmation link is invalid or has expired. Please call the studio and we'll get you set up.
        </p>
        {school.phone && <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ marginTop: 20, color: accent, fontWeight: 700, textDecoration: 'none' }}>📞 {school.phone}</a>}
      </div>
    );
  }

  if (status === 'done' || status === 'already') {
    return (
      <div style={wrap}>
        <div style={badge}>{school.name}</div>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26, boxShadow: '0 8px 32px rgba(34,197,94,0.25)' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M8 18.5L15 25.5L28 11" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 style={{ fontSize: 'clamp(26px,5vw,38px)', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          {status === 'already' ? "You're all set!" : "You're enrolled!"}
        </h1>
        <p style={{ fontSize: 18, color: '#555', fontWeight: 600, margin: '0 0 8px', maxWidth: 420 }}>
          {booking.student_name ? booking.student_name + "'s " : 'Your '}{(booking.program || 'music').split(',')[0]} lessons are confirmed.
        </p>
        {(booking.date || booking.time) && (
          <p style={{ fontSize: 16, color: '#888', margin: '0 0 28px' }}>
            {prettyDate(booking.date)}{booking.date && booking.time ? ' · ' : ''}{booking.time || ''}{booking.teacher ? ' with ' + booking.teacher : ''}
          </p>
        )}
        <p style={{ fontSize: 15, color: '#aaa', maxWidth: 400, lineHeight: 1.6 }}>
          {school.name} has your details and will see you at your first lesson.
        </p>
      </div>
    );
  }

  // ready / confirming
  return (
    <div style={wrap}>
      <div style={badge}>{school.name}</div>
      <h1 style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
        Confirm your spot
      </h1>
      <p style={{ fontSize: 16, color: '#888', margin: '0 0 28px', maxWidth: 400, lineHeight: 1.6 }}>
        {booking.student_name ? booking.student_name + ', tap' : 'Tap'} below to lock in your lesson time. This confirms your enrollment.
      </p>

      <div style={{ background: '#f8f8f6', border: '1px solid #f0f0ee', borderRadius: 14, padding: '24px 28px', marginBottom: 28, minWidth: 280, maxWidth: 360, width: '100%' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 12 }}>Your lesson</div>
        <div style={{ fontSize: 21, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{(booking.program || 'Music').split(',')[0]}</div>
        {(booking.date || booking.time) && (
          <div style={{ fontSize: 16, color: '#555', fontWeight: 600 }}>
            {prettyDate(booking.date)}{booking.date && booking.time ? ' · ' : ''}{booking.time || ''}
          </div>
        )}
        {booking.teacher && <div style={{ fontSize: 15, color: '#888', marginTop: 4 }}>with {booking.teacher}</div>}
      </div>

      <button
        onClick={confirm}
        disabled={status === 'confirming'}
        style={{
          padding: '15px 40px', background: accent, color: '#fff', border: 'none', borderRadius: 11,
          fontSize: 17, fontWeight: 800, cursor: status === 'confirming' ? 'not-allowed' : 'pointer',
          opacity: status === 'confirming' ? 0.6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 8px 24px ' + accent + '40',
        }}>
        {status === 'confirming' ? 'Confirming…' : 'Confirm my spot ✓'}
      </button>

      {err && <div style={{ marginTop: 16, fontSize: 14, color: '#ef4444', maxWidth: 360 }}>{err}</div>}
    </div>
  );
}

window.ConfirmPage = ConfirmPage;
