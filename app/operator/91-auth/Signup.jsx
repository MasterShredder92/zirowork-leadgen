// ─── Signup ──────────────────────────────────────────────────
function SignupView({ onSwitchToLogin, onSignupComplete }) {
  const [name, setName]             = React.useState('');
  const [schoolName, setSchoolName] = React.useState('');
  const [email, setEmail]           = React.useState('');
  const [password, setPassword]     = React.useState('');
  const [error, setError]           = React.useState('');
  const [loading, setLoading]       = React.useState(false);
  const [awaitEmail, setAwaitEmail] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: authData, error: authErr } = await window.sb.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (authErr) { setError(authErr.message); setLoading(false); return; }

    if (!authData.session) {
      setAwaitEmail(true);
      setLoading(false);
      return;
    }

    const { data: studioData, error: rpcErr } = await window.sb.rpc('create_studio_for_new_user', {
      p_studio_name: schoolName,
      p_location_name: schoolName,
      p_owner_name: name,
    });
    if (rpcErr) { setError(rpcErr.message); setLoading(false); return; }

    window.currentUser   = { ...authData.session.user, full_name: name, role: 'owner' };
    window.currentStudio = { id: studioData.studio_id, name: schoolName };
    onSignupComplete(authData.session, studioData, schoolName);
  };

  if (awaitEmail) {
    const MailIcon = window.LucideReact?.Mail;
    return (
      <window.AuthWrap>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ display: 'inline-flex', padding: 16, borderRadius: 16, background: 'rgba(224,77,39,0.1)', marginBottom: 20 }}>
            {MailIcon && <MailIcon size={28} strokeWidth={1.5} color="var(--accent)" />}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7 }}>
            Confirmation sent to <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{email}</span>.<br />
            Click the link to finish setup.
          </div>
        </div>
      </window.AuthWrap>
    );
  }

  return (
    <window.AuthWrap>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={window.authLabel}>Your name</label>
          <input type="text" required autoComplete="name" value={name}
            onChange={e => setName(e.target.value)} style={window.authInput} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={window.authLabel}>Music school name</label>
          <input type="text" required value={schoolName}
            onChange={e => setSchoolName(e.target.value)} style={window.authInput} placeholder="Harmony Music Academy" />
        </div>
        <div>
          <label style={window.authLabel}>Email</label>
          <input type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} style={window.authInput} placeholder="you@example.com" />
        </div>
        <div>
          <label style={window.authLabel}>Password</label>
          <input type="password" required autoComplete="new-password" minLength={6} value={password}
            onChange={e => setPassword(e.target.value)} style={window.authInput} placeholder="Min. 6 characters" />
        </div>
        <window.AuthError msg={error} />
        <button type="submit" disabled={loading} style={window.authBtn(loading)}>
          {loading ? 'Setting up your studio…' : 'Create account'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-4)' }}>
        Already have an account?{' '}
        <span onClick={onSwitchToLogin} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
          Sign in
        </span>
      </div>
    </window.AuthWrap>
  );
}

window.SignupView = SignupView;