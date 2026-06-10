// theme.js — Dual light/dark color token system
// Loaded as a plain <script> before all Babel components.
// Components access colors via `const T = window.T;`
// Toggle via window.toggleTheme()

(function () {
  const stored = localStorage.getItem('zw-theme');
  const isDark = stored !== 'light'; // default: dark

  const dark = {
    isDark: true,
    // Backgrounds — neutral cool grays
    bg: '#1A1C1F', sidebarBg: '#141619', cardBg: '#26292D', surface: '#26292D',
    elevatedBg: '#303338', inputBg: 'rgba(255,255,255,0.05)',
    headerBg: '#1E2024',
    // Text
    t1: '#F5F4F1', t2: '#B0ADA9', t3: '#7A7773', t4: '#565350', t5: '#383532',
    // Borders
    border: 'rgba(255,255,255,0.08)', borderMed: 'rgba(255,255,255,0.12)',
    hover: 'rgba(255,255,255,0.05)', active: 'rgba(255,255,255,0.08)',
    activeB: 'rgba(255,255,255,0.06)',
    accent: '#FD802E',
    // Status badges
    paidBg: 'rgba(16,185,129,0.15)', paidText: '#34D399', paidDot: '#10B981',
    overdueBg: 'rgba(239,68,68,0.15)', overdueText: '#F87171', overdueDot: '#EF4444',
    pendingBg: 'rgba(245,158,11,0.15)', pendingText: '#FCD34D', pendingDot: '#F59E0B',
    // Instrument badges
    pianoBg: 'rgba(99,102,241,0.22)', pianoText: '#A5B4FC',
    violinBg: 'rgba(96,165,250,0.22)', violinText: '#93C5FD',
    celloBg: 'rgba(251,191,36,0.22)',  celloText: '#FDE68A',
    harpBg: 'rgba(192,132,252,0.22)', harpText: '#E9D5FF',
    // Avatars
    av: [
      {bg:'rgba(67,56,202,0.3)',fg:'#A5B4FC'},{bg:'rgba(194,65,12,0.3)',fg:'#FDBA74'},
      {bg:'rgba(6,95,70,0.3)',fg:'#6EE7B7'},{bg:'rgba(153,27,27,0.3)',fg:'#FCA5A5'},
      {bg:'rgba(29,78,216,0.3)',fg:'#93C5FD'},{bg:'rgba(109,40,217,0.3)',fg:'#D8B4FE'},
      {bg:'rgba(146,64,14,0.3)',fg:'#FDE68A'},{bg:'rgba(20,83,45,0.3)',fg:'#86EFAC'},
    ],
    // Calendar
    calBg: '#1E2024', calHeaderBg: '#26292D',
    calBorder: 'rgba(255,255,255,0.06)', calHalf: 'rgba(255,255,255,0.025)',
    calToday: '#26292D',
    // Lifecycle canvas
    lcDotBg: '#1A1C1F', lcDotBorder: 'rgba(255,255,255,0.15)',
    lcDotFill: 'rgba(255,255,255,0.18)', lcLine: 'rgba(255,255,255,0.08)',
    lcAnim: 'rgba(255,255,255,0.15)', lcGrid: 'rgba(255,255,255,0.06)',
    lcTriggerBorder: 'rgba(255,255,255,0.14)', lcCardBg: '#26292D',
    lcCardBorder: 'rgba(255,255,255,0.08)', lcAddBg: 'rgba(255,255,255,0.04)',
    lcAddBorder: 'rgba(255,255,255,0.12)',
    // Drawer / modal
    drawerBg: '#1E2024',
    drawerShadow: '-1px 0 0 rgba(255,255,255,0.06), -20px 0 60px rgba(0,0,0,0.6)',
    scrim: 'rgba(0,0,0,0.45)',
    sysMsg: 'rgba(255,255,255,0.05)',
    // Scrollbar
    scrollThumb: 'rgba(255,255,255,0.1)',
  };

  const light = {
    isDark: false,
    bg: '#F7F2E8', sidebarBg: '#E8DCC8', cardBg: '#FFFFFF', surface: '#FFFFFF',
    elevatedBg: '#EFE6D6', inputBg: '#F7F2E8',
    headerBg: '#E8DCC8',
    // Text — significantly darkened for WCAG AA compliance on #FAFAF8
    // t2: 7.9:1 · t3: 4.8:1 · t4: 3.2:1 · t5: 2.0:1
    t1: '#162833', t2: '#3D4F58', t3: '#6B7880', t4: '#8C9298', t5: '#A8AAA4',
    accent: '#D9641C',
    border: 'rgba(0,0,0,0.07)', borderMed: 'rgba(0,0,0,0.11)',
    hover: 'rgba(0,0,0,0.04)', active: 'rgba(0,0,0,0.07)',
    activeB: 'rgba(0,0,0,0.05)',
    rowHover: 'rgba(0,0,0,0.04)',
    paidBg: '#D1F4E8', paidText: '#034636', paidDot: '#059669',
    overdueBg: '#FDCCCB', overdueText: '#7F1D1D', overdueDot: '#DC2626',
    pendingBg: '#FEE9A6', pendingText: '#78350F', pendingDot: '#CA8A04',
    pianoBg: '#C7D2FE', pianoText: '#1E1B4B',
    violinBg: '#BFDBFE', violinText: '#0C2340',
    celloBg: '#FEE2A6',  celloText: '#541E07',
    harpBg: '#E9D5FF',  harpText: '#4A0E4E',
    av: [
      {bg:'#C7D2FE',fg:'#1E1B4B'},{bg:'#FEEDEA',fg:'#601911'},
      {bg:'#D1F4E8',fg:'#034636'},{bg:'#FDCCCB',fg:'#7F1D1D'},
      {bg:'#BFDBFE',fg:'#0C2340'},{bg:'#E9D5FF',fg:'#4A0E4E'},
      {bg:'#FEE9A6',fg:'#78350F'},{bg:'#D1FAE5',fg:'#134E4A'},
    ],
    calBg: '#FFFFFF', calHeaderBg: '#FFFFFF',
    calBorder: 'rgba(0,0,0,0.07)', calHalf: 'rgba(0,0,0,0.04)',
    calToday: '#F7F2E8',
    lcDotBg: '#EFE6D6', lcDotBorder: 'rgba(0,0,0,0.15)',
    lcDotFill: '#D0CFCC', lcLine: 'rgba(0,0,0,0.08)',
    lcAnim: 'rgba(0,0,0,0.15)', lcGrid: 'rgba(0,0,0,0.11)',
    lcTriggerBorder: 'rgba(0,0,0,0.15)', lcCardBg: '#FFFFFF',
    lcCardBorder: 'rgba(0,0,0,0.08)', lcAddBg: 'rgba(255,255,255,0.8)',
    lcAddBorder: 'rgba(0,0,0,0.15)',
    drawerBg: '#FFFFFF',
    drawerShadow: '-1px 0 0 rgba(0,0,0,0.06), -20px 0 60px rgba(0,0,0,0.1)',
    scrim: 'rgba(0,0,0,0.2)',
    sysMsg: '#F5F5F3',
    scrollThumb: 'rgba(0,0,0,0.12)',
  };

  window.T = isDark ? dark : light;
  window.THEME_DARK = isDark;

  function syncVars(t) {
    var r = document.documentElement;
    r.style.setProperty('--bg',         t.bg);
    r.style.setProperty('--sidebar-bg', t.sidebarBg);
    r.style.setProperty('--surface',    t.cardBg);
    r.style.setProperty('--border',     t.border);
    r.style.setProperty('--border-med', t.borderMed);
    r.style.setProperty('--text',       t.t1);
    r.style.setProperty('--text-1',     t.t1);
    r.style.setProperty('--text-2',     t.t2);
    r.style.setProperty('--text-3',     t.t3);
    r.style.setProperty('--text-4',     t.t4);
    r.style.setProperty('--bg-hover',   t.hover);
    r.style.setProperty('--row-hover',  t.hover);
    r.style.setProperty('--nav-active', t.active);
    r.style.setProperty('--bg-card',    t.cardBg);
  }
  syncVars(window.T);

  // Live theme switch — pixel crawl transition
  window.toggleTheme = function() {
    var newDark = !window.T.isDark;
    var newT    = newDark ? dark : light;
    var oldT    = window.T;

    // Canvas overlay: paint old bg, then crawl-erase blocks to reveal new theme
    var canvas  = document.createElement('canvas');
    var dpr     = window.devicePixelRatio || 1;
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.cssText = 'position:fixed;inset:0;width:'+W+'px;height:'+H+'px;z-index:99999;pointer-events:none;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Fill with old background immediately
    ctx.fillStyle = oldT.bg;
    ctx.fillRect(0, 0, W, H);

    // Swap theme now — page re-renders under the canvas
    window.T          = newT;
    window.THEME_DARK = newDark;
    localStorage.setItem('zw-theme', newDark ? 'dark' : 'light');
    syncVars(newT);
    window.dispatchEvent(new CustomEvent('zw-theme-changed', { detail: newT }));

    // Pixel block size — 4px gives visible crawl without being chunky
    var BLOCK = 4;
    var cols  = Math.ceil(W / BLOCK);
    var rows  = Math.ceil(H / BLOCK);

    // Pre-compute each block's reveal threshold based on direction + noise
    // Light→Dark: crawl from top-right diagonally
    // Dark→Light: crawl from bottom-left diagonally
    var goingDark = newDark;
    var thresholds = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var diag = goingDark
          ? ((cols - c) + r) / (cols + rows)  // top-right → bottom-left
          : (c + (rows - r)) / (cols + rows);  // bottom-left → top-right
        // Deterministic per-block noise for organic feel
        var noise = ((c * 1619 + r * 7) % 256) / 256 * 0.12;
        thresholds[r * cols + c] = Math.min(diag + noise, 1);
      }
    }

    var DURATION  = 1200; // ms — slow enough to watch
    var startTime = performance.now();

    function animate(now) {
      var progress = Math.min((now - startTime) / DURATION, 1);
      ctx.clearRect(0, 0, W, H);

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (progress < thresholds[r * cols + c]) {
            ctx.fillStyle = oldT.bg;
            ctx.fillRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }

    requestAnimationFrame(animate);
  };

  // Apply immediately so no flash
  var s = document.createElement('style');
  s.textContent = 'html,body{background:' + window.T.bg + '!important;color:' + window.T.t1 + '!important}';
  document.head.appendChild(s);
})();
