function UserMenu() {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'var(--bg-hover)', border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #D97757, #2A6FDB)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>MC</div>
        <span>▼</span>
      </button>

      {userMenuOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          minWidth: 200, marginTop: 8, zIndex: 1000
        }}>
          <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            My Profile
          </div>
          <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            Settings
          </div>
          <div style={{ padding: '10px 16px', fontSize: 13, color: '#EF4444', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
            Logout
          </div>
        </div>
      )}
    </div>
  );
}
window.UserMenu = UserMenu;
