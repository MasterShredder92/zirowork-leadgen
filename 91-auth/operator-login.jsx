// operator-login.jsx — ZiroWork Operator CRM sign-in.
// Real Supabase Auth. Only accounts carrying app_metadata.role === 'operator' get in;
// anything else (e.g. a client portal login) is signed back out. Privileged actions
// (billing charges) verify the same role server-side.
window.OperatorLogin = function OperatorLogin({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authErr } = await window.sb.auth.signInWithPassword({ email, password });
      if (authErr) { setError(authErr.message); setLoading(false); return; }

      const role = data.user && data.user.app_metadata && data.user.app_metadata.role;
      if (role !== 'operator') {
        await window.sb.auth.signOut();
        setError('This account is not an operator. Use the client portal at /dashboard.');
        setLoading(false);
        return;
      }
      onLogin(data.user);
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  const s = {
    wrap: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
    card: { width: 380, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 36px', boxShadow: 'var(--shadow-md)' },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
    logoMark: { width: 30, height: 30, background: 'var(--accent)', borderRadius: 7, flexShrink: 0 },
    logoText: { fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.3px' },
    logoSub: { fontSize: 13, color: 'var(--text-3)', fontWeight: 500 },
    heading: { fontSize: 21, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.4px', marginBottom: 5 },
    sub: { fontSize: 14, color: 'var(--text-3)', marginBottom: 28 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 },
    input: { width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: 8, fontSize: 15, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit' },
    fieldWrap: { marginBottom: 16 },
    btn: { width: '100%', padding: '11px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 10, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 },
    err: { marginTop: 12, fontSize: 13, color: '#FCA5A5', background: 'rgba(239,68,68,0.12)', borderRadius: 6, padding: '8px 10px' },
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>
          <div className="zw-logo" style={s.logoMark} />
          <div>
            <div style={s.logoText}>ZiroWork</div>
            <div style={s.logoSub}>Operator CRM</div>
          </div>
        </div>

        <div style={s.heading}>Sign in</div>
        <div style={s.sub}>Operator access only</div>

        <form onSubmit={handleSubmit}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@zirowork.com" required autoFocus />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          {error && <div style={s.err}>{error}</div>}
        </form>
      </div>
    </div>
  );
};
