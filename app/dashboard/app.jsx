// Client Portal — root component
// Auth gate → 4-view shell with sidebar nav

(function () {
  const { useState, useEffect } = React;

  const NAV = [
    { key: 'overview',  label: 'Overview',    icon: '◈' },
    { key: 'pipeline',  label: 'Pipeline',    icon: '⟶' },
    { key: 'upload',    label: 'Upload',      icon: '↑' },
    { key: 'business',  label: 'My Business', icon: '⊕' },
  ];

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
      logoText: { fontSize: 14, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px' },
      logoSub: { fontSize: 11, color: 'var(--t3)', fontWeight: 500 },
      nav: { flex: 1, padding: '10px 10px' },
      navItem: (active) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
        background: active ? 'var(--hover)' : 'transparent',
        marginBottom: 2, transition: 'background 0.1s',
        userSelect: 'none',
      }),
      navIcon: (active) => ({
        fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0,
        color: active ? 'var(--accent)' : 'var(--t3)',
      }),
      navLabel: (active) => ({
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? 'var(--t1)' : 'var(--t2)',
      }),
      footer: {
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
      },
      schoolName: { fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 2 },
      schoolSub: { fontSize: 11, color: 'var(--t4)', marginBottom: 10 },
      logoutBtn: {
        fontSize: 11, color: 'var(--t3)', background: 'none',
        border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'inherit', fontWeight: 500,
      },
    };

    return (
      <div style={s.sidebar}>
        <div style={s.logoWrap}>
          <div style={s.logoMark} />
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

    if (checking) return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--t3)', fontSize: 13 }}>Loading…</div>
      </div>
    );

    if (!user || !tenantId) return <window.PortalLogin onLogin={handleLogin} />;

    return <Portal user={user} tenantId={tenantId} />;
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
