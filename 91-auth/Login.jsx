// ─── Login ───────────────────────────────────────────────────
function LoginView({ onSwitchToSignup, onLoginComplete }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError]       = React.useState('');
  const [loading, setLoading]   = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    onLoginComplete(data.session);
  };

  return (
    <window.AuthWrap>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={window.authLabel}>Email</label>
          <input type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} style={window.authInput} placeholder="you@example.com" />
        </div>
        <div>
          <label style={window.authLabel}>Password</label>
          <input type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} style={window.authInput} placeholder="••••••••" />
        </div>
        <window.AuthError msg={error} />
        <button type="submit" disabled={loading} style={window.authBtn(loading)}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-4)' }}>
        New studio?{' '}
        <span onClick={onSwitchToSignup} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
          Create account
        </span>
      </div>
    </window.AuthWrap>
  );
}

window.LoginView = LoginView;