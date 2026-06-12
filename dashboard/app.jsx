// Client Portal — root component
// Auth gate → 4-view shell with sidebar nav

(function () {
  const { useState, useEffect } = React;

  const NAV = [
    { key: 'overview',  label: 'Overview',    icon: '◈' },
    { key: 'pipeline',  label: 'Pipeline',    icon: '⟶' },
    { key: 'upload',    label: 'Upload',      icon: '↑' },
    { key: 'business',  label: 'My Business', icon: '⊕' },
    { key: 'billing',   label: 'Billing',     icon: '▭' },
  ];

  function ThemeToggle() {
    const [dark, setDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
    function toggle() {
      const next = !dark;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('zw-portal-theme', next ? 'dark' : 'light'); } catch (e) {}
      setDark(next);
    }
    return (
      <button onClick={toggle} title="Toggle light / dark"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '7px 9px', marginBottom: 10, borderRadius: 7,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--t2)', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 500,
        }}>
        {dark
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>}
        {dark ? 'Light mode' : 'Dark mode'}
      </button>
    );
  }

  function Sidebar({ view, setView, schoolName, onLogout }) {
    const s = {
      sidebar: {
        width: 220, flexShrink: 0, height: '100%',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      },
      logoWrap: {
        padding: '20px 18px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 9,
      },
      logoMark: {
        width: 24, height: 24, background: 'var(--accent)',
        borderRadius: 5, flexShrink: 0,
      },
      logoText: { fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px' },
      logoSub: { fontSize: 12, color: 'var(--t3)', fontWeight: 500 },
      nav: { flex: 1, padding: '10px 10px' },
      navItem: (active) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
        background: active ? 'var(--hover)' : 'transparent',
        marginBottom: 2, transition: 'background 0.1s',
        userSelect: 'none',
      }),
      navIcon: (active) => ({
        fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0,
        color: active ? 'var(--accent)' : 'var(--t3)',
      }),
      navLabel: (active) => ({
        fontSize: 14, fontWeight: active ? 600 : 500,
        color: active ? 'var(--t1)' : 'var(--t2)',
      }),
      footer: {
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
      },
      schoolName: { fontSize: 13, fontWeight: 600, color: 'var(--t2)', marginBottom: 2 },
      schoolSub: { fontSize: 12, color: 'var(--t4)', marginBottom: 10 },
      logoutBtn: {
        fontSize: 12, color: 'var(--t3)', background: 'none',
        border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'inherit', fontWeight: 500,
      },
    };

    return (
      <div style={s.sidebar}>
        <div style={s.logoWrap}>
          <div className="zw-logo" style={{ width: 26, height: 26 }} />
          <div>
            <div style={s.logoText}>ZiroWork</div>
            <div style={s.logoSub}>Client Portal</div>
          </div>
        </div>

        <div style={s.nav}>
          {NAV.map(item => (
            <div key={item.key} style={s.navItem(view === item.key)} onClick={() => setView(item.key)}>
              <span style={s.navIcon(view === item.key)}>{item.icon}</span>
              <span style={s.navLabel(view === item.key)}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={s.footer}>
          <ThemeToggle />
          <div style={s.schoolName}>{schoolName || 'Your School'}</div>
          <div style={s.schoolSub}>Client account</div>
          <button style={s.logoutBtn} onClick={onLogout}>Sign out</button>
        </div>
      </div>
    );
  }

  function Portal({ user, tenantId }) {
    const [view, setView] = useState('overview');
    const [schoolName, setSchoolName] = useState('');

    useEffect(() => {
      window.sb
        .from('agent_tenants')
        .select('name')
        .eq('tenant_id', tenantId)
        .single()
        .then(({ data }) => { if (data) setSchoolName(data.name); });
    }, [tenantId]);

    async function handleLogout() {
      await window.sb.auth.signOut();
      window.location.reload();
    }

    const main = {
      display: 'flex', width: '100%', height: '100%',
    };
    const content = {
      flex: 1, height: '100%', overflow: 'hidden', background: 'var(--bg)',
    };

    return (
      <div style={main}>
        <Sidebar view={view} setView={setView} schoolName={schoolName} onLogout={handleLogout} />
        <div style={content}>
          {view === 'overview' && <window.PortalOverview tenantId={tenantId} />}
          {view === 'pipeline' && <window.PortalPipeline tenantId={tenantId} />}
          {view === 'upload'   && <window.PortalUpload   tenantId={tenantId} userId={user.id} />}
          {view === 'business' && <window.PortalMyBusiness tenantId={tenantId} />}
          {view === 'billing'  && <window.PortalBilling tenantId={tenantId} />}
        </div>
      </div>
    );
  }

  function App() {
    const [user, setUser]         = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      // Check for existing session on load
      window.sb.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data: cu } = await window.sb
            .from('client_users')
            .select('tenant_id')
            .eq('user_id', session.user.id)
            .single();
          if (cu) {
            setUser(session.user);
            setTenantId(cu.tenant_id);
          }
        }
        setChecking(false);
      });
    }, []);

    function handleLogin(u, tid) {
      setUser(u);
      setTenantId(tid);
    }

    // Design preview bypass: /dashboard/?preview renders the portal with sample data, no login.
    if (new URLSearchParams(window.location.search).has('preview')) {
      return <Portal user={{ id: 'preview' }} tenantId="preview" />;
    }

    if (checking) return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--t3)', fontSize: 14 }}>Loading…</div>
      </div>
    );

    if (!user || !tenantId) return <window.PortalLogin onLogin={handleLogin} />;

    return <Portal user={user} tenantId={tenantId} />;
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
