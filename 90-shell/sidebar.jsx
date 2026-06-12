// sidebar.jsx — ZiroWork Operator CRM
// Preserved visual system. Business nouns remapped to operator context.
const { useState, useEffect, useRef } = React;
const L = window.LucideReact || {};

const NAV = [
  { section: 'OPS', items: [
    { id: 'command-center', label: 'Command Center', icon: 'LayoutDashboard' },
    { id: 'clients',        label: 'Clients',         icon: 'Building2' },
    { id: 'onboarding',    label: 'Onboarding',      icon: 'ClipboardList' },
  ]},
  { section: 'FUNNELS', items: [
    { id: 'campaigns', label: 'Campaigns', icon: 'Megaphone' },
    { id: 'pages',     label: 'Pages',     icon: 'Globe' },
  ]},
  { section: 'PIPELINE', items: [
    { id: 'leads',         label: 'Leads',         icon: 'Inbox' },
    { id: 'conversations', label: 'Conversations', icon: 'MessageSquare' },
    { id: 'escalations',   label: 'Escalations',   icon: 'AlertTriangle' },
    { id: 'bookings',      label: 'Bookings',      icon: 'CalendarCheck' },
    { id: 'enrollments',   label: 'Enrollments',   icon: 'UserCheck' },
  ]},
  { section: 'PERFORMANCE', items: [
    { id: 'reporting',   label: 'Reporting',   icon: 'BarChart2' },
    { id: 'insights',    label: 'Insights',    icon: 'Sparkles' },
    { id: 'studio-map',  label: 'Studio Map',  icon: 'Network' },
  ]},
  { section: 'SYSTEM', items: [
    { id: 'automation-rules', label: 'Automation Rules', icon: 'Zap' },
    { id: 'integrations',     label: 'Integrations',     icon: 'Plug' },
    { id: 'settings',         label: 'Settings',         icon: 'Settings' },
  ]},
];

const QUICK_CMDS = [
  { label: 'Command Center',    icon: 'LayoutDashboard', nav: 'command-center' },
  { label: 'View all clients',  icon: 'Building2',       nav: 'clients' },
  { label: 'Check escalations', icon: 'AlertTriangle',   nav: 'escalations' },
  { label: 'Open leads',        icon: 'Inbox',           nav: 'leads' },
  { label: 'View bookings',     icon: 'CalendarCheck',   nav: 'bookings' },
  { label: 'See campaigns',     icon: 'Megaphone',       nav: 'campaigns' },
];

// ── Bolt Mark ─────────────────────────────────────────────────────────────
function BoltMark({ size = 30, firing = false, onClick }) {
  const T = window.T || {};
  const isMobile = window.useIsMobile ? window.useIsMobile() : false;
  const src = T.isDark
    ? '92-design/brand/zw-bolt-dark.png'
    : '92-design/brand/zw-bolt-light.png';
  const glowColor = T.isDark ? 'rgba(220,220,220,0.7)' : 'rgba(0,0,0,0.3)';
  if (isMobile) {
    const bars = [
      { x: 0,  h: 10, anim: 'eqB1 1.1s ease-in-out infinite' },
      { x: 5,  h: 16, anim: 'eqB2 0.9s ease-in-out infinite 0.25s' },
      { x: 10, h: 8,  anim: 'eqB3 1.3s ease-in-out infinite 0.1s' },
      { x: 15, h: 13, anim: 'eqB4 1.0s ease-in-out infinite 0.45s' },
    ];
    return (
      <div onClick={onClick} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox="0 0 19 18" style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}>
          {bars.map((b, i) => (
            <rect key={i} x={b.x} y={(18 - b.h) / 2} width={3} height={b.h} rx={1.5} fill={T.t3 || '#8B8986'} style={{ transformOrigin: `${b.x + 1.5}px 9px`, animation: b.anim }} />
          ))}
        </svg>
      </div>
    );
  }
  return (
    <div onClick={onClick} style={{
      width: size, height: size, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: firing ? `drop-shadow(0 0 7px ${glowColor}) brightness(1.4)` : 'none',
      transform: firing ? 'scale(1.14)' : 'scale(1)',
      transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), filter 0.15s ease',
      userSelect: 'none',
    }}>
      <img src={src} width={size} height={size} alt="" style={{ display: 'block', objectFit: 'contain', pointerEvents: 'none' }} />
    </div>
  );
}

// ── Command Palette ────────────────────────────────────────────────────────
function CommandPalette({ onClose, onNavigate }) {
  const T = window.T || {};
  const [q, setQ] = useState('');
  const filtered = QUICK_CMDS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    let active = false;
    const t = setTimeout(() => { active = true; }, 200);
    const fn = e => { if (active && !e.target.closest('[data-cmd-palette]')) onClose(); };
    document.addEventListener('mousedown', fn, true);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn, true); };
  }, []);

  return (
    <div data-cmd-palette="1" style={{
      position: 'fixed', left: 'max(16px, min(228px, calc(50vw - 134px)))', top: 16,
      width: 'min(268px, calc(100vw - 32px))', zIndex: 2000,
      background: T.cardBg || '#1c1b20',
      border: `1px solid ${T.borderMed || 'rgba(255,255,255,0.14)'}`,
      borderRadius: TOKENS.radius.xl,
      boxShadow: T.isDark ? '0 16px 48px rgba(0,0,0,0.7)' : '0 16px 48px rgba(0,0,0,0.15)',
      overflow: 'hidden', animation: 'fadeUp 0.15s ease',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {L.Search && <L.Search size={13} color={T.t3} strokeWidth={1.8} />}
        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && filtered[0]) { onNavigate(filtered[0].nav); onClose(); }}}
          placeholder="Where do you want to go?"
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: T.t1, width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
      </div>
      <div style={{ padding: '6px 6px 8px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '12px 10px', fontSize: 13, color: T.t4, textAlign: 'center' }}>No results</div>
        )}
        {filtered.map(({ label, icon, nav }) => {
          const Icon = L[icon];
          return (
            <button key={label} onClick={() => { onNavigate(nav); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', borderRadius: TOKENS.radius.lg, border: 'none',
              background: 'transparent', color: T.t2, cursor: 'pointer', textAlign: 'left',
              fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.1s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.t1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.t2; }}>
              {Icon && <Icon size={14} strokeWidth={1.7} style={{ flexShrink: 0 }} />}
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: '6px 12px 8px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: T.t4, fontFamily: 'ui-monospace,monospace' }}>↵ select</span>
        <span style={{ fontSize: 11, color: T.t4, fontFamily: 'ui-monospace,monospace' }}>esc close</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.t4 }}>ZiroWork Operator</span>
      </div>
    </div>
  );
}

function Sidebar({ currentView, onNavigate, mobileOpen, onMobileClose }) {
  const T = window.T || {};
  const isMobile = window.useIsMobile ? window.useIsMobile() : false;
  const [boltFiring, setBoltFiring] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const touchStartX = useRef(null);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    if (e.changedTouches[0].clientX - touchStartX.current < -48 && onMobileClose) onMobileClose();
    touchStartX.current = null;
  };

  const fireBolt = () => {
    setBoltFiring(true);
    setTimeout(() => setBoltFiring(false), 400);
    setCmdOpen(o => !o);
  };

  const handleNav = id => {
    onNavigate(id);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const btn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '6px 8px', borderRadius: 7, border: active ? `1px solid ${T.activeB || 'rgba(255,255,255,0.06)'}` : '1px solid transparent',
    background: active ? (T.active || 'rgba(255,255,255,0.08)') : 'transparent',
    color: active ? (T.t1 || '#EFEDEA') : (T.t2 || '#8B8986'),
    cursor: 'pointer', textAlign: 'left', fontSize: 14,
    fontWeight: active ? 500 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.1s',
  });

  const hov   = e => { e.currentTarget.style.background = T.hover || 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.t1 || '#EFEDEA'; };
  const unHov = (active) => e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.t2 || '#8B8986'; }};

  const asideStyle = isMobile ? {
    position: 'fixed', top: 0, left: 0, height: '100%', width: 260, zIndex: 200,
    display: 'flex', flexDirection: 'column',
    background: T.sidebarBg || '#0f0e13',
    overflowY: 'auto', overflowX: 'hidden',
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
    touchAction: 'pan-y',
  } : {
    width: 220, flexShrink: 0, height: '100%',
    display: 'flex', flexDirection: 'column',
    background: T.sidebarBg || '#0f0e13',
    overflowY: 'auto', overflowX: 'hidden', position: 'relative',
  };

  const operatorName = (window.currentOperator && window.currentOperator.name) || 'ZiroWork';
  const userName     = (window.currentUser && window.currentUser.full_name) || 'Operator';
  const userInitials = userName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {isMobile && mobileOpen && (
        <div onClick={onMobileClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }} />
      )}
      <aside style={asideStyle} onTouchStart={isMobile ? onTouchStart : undefined} onTouchEnd={isMobile ? onTouchEnd : undefined}>

        {/* Header */}
        <div style={{ padding: '16px 16px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <BoltMark size={30} firing={boltFiring} onClick={fireBolt} />
              {boltFiring && (
                <div style={{
                  position: 'absolute', inset: -6, borderRadius: '50%',
                  border: `1.5px solid ${T.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                  animation: 'boltRing 0.4s ease-out forwards', pointerEvents: 'none',
                }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, letterSpacing: '-0.2px', lineHeight: 1.2 }}>{operatorName}</div>
              <div style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>Operator CRM · click ⚡ to act</div>
            </div>
            {L.ChevronRight && <L.ChevronRight size={12} color={T.t4} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
          </div>
        </div>

        {cmdOpen && (
          <CommandPalette onClose={() => setCmdOpen(false)} onNavigate={v => { handleNav(v); setCmdOpen(false); }} />
        )}

        {/* Search */}
        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
          <div onClick={fireBolt} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 8, cursor: 'text', background: T.hover, border: `1px solid ${T.border}` }}>
            {L.Search && <L.Search size={12} color={T.t3} strokeWidth={1.8} />}
            <span style={{ fontSize: 13, color: T.t4 }}>Search…</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: T.t5, fontFamily: 'ui-monospace,monospace' }}>⌘K</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 8px 8px' }}>
          {NAV.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 4 }}>
              <div style={{ padding: '10px 8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.t4 }}>{section}</div>
              {items.map(item => {
                const Icon  = L[item.icon];
                const active = currentView === item.id;
                return (
                  <div key={item.id} style={{ position: 'relative' }}>
                    {active && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.accent, borderRadius: '0 3px 3px 0' }} />}
                    <button onClick={() => handleNav(item.id)} style={btn(active)}
                      onMouseEnter={e => { if (!active) hov(e); }}
                      onMouseLeave={unHov(active)}>
                      {Icon && <Icon size={14} strokeWidth={active ? 2 : 1.7} style={{ flexShrink: 0 }} />}
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: '4px 8px' }}>
          <button onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            window.toggleTheme && window.toggleTheme(Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2));
          }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: 7, border: 'none', background: 'transparent', color: T.t3, cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.t1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.t3; }}>
            {L.Circle && <L.Circle size={14} strokeWidth={1.7} />}
            <span>{T.isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        {/* User */}
        <div style={{ padding: '2px 8px 14px', position: 'relative' }}>
          {userMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 8, right: 8, marginBottom: 4,
              background: T.cardBg || '#1c1b20',
              border: `1px solid ${T.borderMed || 'rgba(255,255,255,0.14)'}`,
              borderRadius: 10,
              boxShadow: T.isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 100,
            }}>
              <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{userName}</div>
                <div style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>ZiroWork Operator</div>
              </div>
              <div style={{ padding: '6px 6px 6px' }}>
                {[
                  { label: 'Settings', icon: 'Settings', nav: 'settings' },
                  { label: 'Sign out',  icon: 'LogOut',   nav: null },
                ].map(({ label, icon, nav }) => {
                  const Icon = L[icon];
                  return (
                    <button key={label} onClick={() => {
                      setUserMenuOpen(false);
                      if (nav) handleNav(nav);
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                      padding: '7px 10px', borderRadius: 7, border: 'none',
                      background: 'transparent', color: label === 'Sign out' ? T.t3 : T.t2,
                      cursor: 'pointer', fontSize: 13, textAlign: 'left',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.1s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.t1; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = label === 'Sign out' ? T.t3 : T.t2; }}>
                      {Icon && <Icon size={13} strokeWidth={1.7} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={() => setUserMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '6px 8px', borderRadius: 7, border: 'none', background: userMenuOpen ? T.hover : 'transparent', color: T.t1, cursor: 'pointer', textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background 0.1s' }}
            onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.background = T.hover; }}
            onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: T.isDark ? 'rgba(255,255,255,0.12)' : '#1C1C1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#F7F2E8', fontWeight: 600 }}>
              {userInitials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>Operator</div>
            </div>
            {L.ChevronsUpDown && <L.ChevronsUpDown size={12} color={T.t4} style={{ flexShrink: 0 }} />}
          </button>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { Sidebar, CommandPalette });
