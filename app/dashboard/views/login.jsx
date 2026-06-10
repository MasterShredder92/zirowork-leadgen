window.PortalLogin = function PortalLogin({ onLogin }) {
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

      // Look up their tenant_id
      const { data: cu, error: cuErr } = await window.sb
        .from('client_users')
        .select('tenant_id')
        .eq('user_id', data.user.id)
        .single();

      if (cuErr || !cu) {
        await window.sb.auth.signOut();
        setError('Account not linked to a client. Contact ZiroWork.');
        setLoading(false);
        return;
      }

      onLogin(data.user, cu.tenant_id);
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  const s = {
    wrap: {
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    },
    card: {
      width: 380, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 12,
      padding: '36px 32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)',
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
    },
    logoMark: {
      width: 28, height: 28, background: 'var(--accent)',
      borderRadius: 6, flexShrink: 0,
    },
    logoText: {
      fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px',
    },
    logoSub: {
      fontSize: 12, color: 'var(--t3)', fontWeight: 500,
    },
    heading: {
      fontSize: 20, fontWeight: 700, color: 'var(--t1)',
      letterSpacing: '-0.4px', marginBottom: 4,
    },
    sub: { fontSize: 13, color: 'var(--t3)', marginBottom: 24 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 5 },
    input: {
      width: '100%', padding: '9px 12px',
      background: 'var(--bg)', border: '1px solid var(--bmed)',
      borderRadius: 7, fontSize: 14, color: 'var(--t1)',
      outline: 'none', fontFamily: 'inherit',
    },
    fieldWrap: { marginBottom: 14 },
    btn: {
      width: '100%', padding: '10px 0',
      background: 'var(--accent)', color: '#fff',
      border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600,
      cursor: 'pointer', marginTop: 8, fontFamily: 'inherit',
      opacity: loading ? 0.6 : 1,
    },
    err: {
      marginTop: 12, fontSize: 12, color: '#B91C1C',
      background: '#FEE2E2', borderRadius: 6, padding: '8px 10px',
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoMark} />
          <div>
            <div style={s.logoText}>ZiroWork</div>
            <div style={s.logoSub}>Client Portal</div>
          </div>
        </div>

        <div style={s.heading}>Welcome back</div>
        <div style={s.sub}>Sign in to view your pipeline</div>

        <form onSubmit={handleSubmit}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourschool.com"
              required
              autoFocus
            />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
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
