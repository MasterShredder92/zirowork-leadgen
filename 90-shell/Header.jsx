function MusicEQIcon({ color }) {
  const c = color || '#8B8986';
  const bars = [
    { x:0,  h:10, anim:'eqB1 1.1s ease-in-out infinite' },
    { x:5,  h:16, anim:'eqB2 0.9s ease-in-out infinite 0.25s' },
    { x:10, h:8,  anim:'eqB3 1.3s ease-in-out infinite 0.1s' },
    { x:15, h:13, anim:'eqB4 1.0s ease-in-out infinite 0.45s' },
  ];
  return (
    <svg width="19" height="18" viewBox="0 0 19 18" style={{ display:'block', overflow:'visible' }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={(18-b.h)/2} width={3} height={b.h} rx={1.5} fill={c}
          style={{ transformOrigin:`${b.x+1.5}px 9px`, animation:b.anim }} />
      ))}
    </svg>
  );
}

function MobileHeader({ onMenuOpen, onBack, canGoBack, pageTitle }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const schoolName = (window.currentOperator && window.currentOperator.name) || 'ZiroWork';
  return (
    <div style={{ background:T.sidebarBg||'#0f0e13', borderBottom:`1px solid ${T.border}`, padding:'11px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0, animation:'mhSlideDown 0.2s ease' }}>
      <button
        onClick={canGoBack ? onBack : onMenuOpen}
        style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, width:44, height:44, transition:'opacity 0.15s' }}
      >
        {canGoBack
          ? (L.ChevronLeft && <L.ChevronLeft size={22} strokeWidth={1.75} color={T.t1} />)
          : <div style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MusicEQIcon color={T.t3} />
            </div>
        }
      </button>
      <div style={{ fontSize:14, fontWeight:600, color:T.t1, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'opacity 0.15s' }}>
        {pageTitle}
      </div>
    </div>
  );
}

// Placeholder for routes not yet built
function ComingSoon({ label }) {
  const T = window.T || {};
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{label}</div>
      <div style={{ fontSize: 12, color: T.t3 }}>Coming soon</div>
    </div>
  );
}

window.MobileHeader = MobileHeader;
window.ComingSoon = ComingSoon;