// ─── Studio Map ──────────────────────────────────────────────────────────────
// Obsidian-style force graph. Dark bg, muted glow nodes, physics always on.
// Three views: Funnel Tree | Lead Journey | Operator Blockers
// ─────────────────────────────────────────────────────────────────────────────

// Muted palette — same hues as before, desaturated to match dark-graph aesthetic
const CLIENT_COLORS  = ['#c45c5c', '#5c8ac4', '#5cb87a', '#c4935c', '#a05cc4'];
const STAGE_COLORS   = { new: '#5cb8b8', contacted: '#5c8ac4', qualified: '#5cb87a', follow_up: '#c4935c' };
const OUTCOME_COLORS = { enrolled: '#5cb87a', follow_up: '#c4935c', lost: '#c45c5c' };
const HEALTH_COLORS  = { healthy: '#5cb87a', at_risk: '#c45c5c', stuck: '#c4935c', onboarding: '#5c8ac4' };

const GRAPH_BG   = '#0f0f0f';
const SIDEBAR_BG = '#111';
const BORDER_CLR = 'rgba(255,255,255,0.07)';
const TEXT_DIM   = '#666';
const TEXT_MID   = '#999';
const TEXT_MAIN  = '#ccc';

function smClientColor(clientId, clients) {
  const idx = clients.findIndex(c => c.id === clientId);
  return CLIENT_COLORS[Math.max(idx, 0) % CLIENT_COLORS.length];
}

function smNode(id, label, color, size, type, raw, extra = {}) {
  return {
    id, label,
    color: {
      background: color + '28',           // ~16% fill — almost invisible
      border: color,
      highlight: { background: color + '55', border: '#fff' },
      hover:      { background: color + '44', border: color },
    },
    size,
    shadow: { enabled: true, color: color + '66', size: size * 1.4, x: 0, y: 0 },
    font: { size: size > 14 ? 11 : 0, color: TEXT_MAIN, face: 'Inter, sans-serif' },
    borderWidth: 1.5,
    borderWidthSelected: 2.5,
    _type: type, _raw: raw,
    ...extra,
  };
}

function buildFunnelData(clients, campaigns, leads, enrollments) {
  const nodes = [], edges = [];

  clients.forEach((c, i) => {
    const cc = CLIENT_COLORS[i % CLIENT_COLORS.length];
    nodes.push(smNode(c.id, c.name, cc, 22, 'client', c));
  });

  campaigns.forEach(c => {
    const cc = smClientColor(c.client_id, clients);
    nodes.push(smNode(c.id, c.program, cc, 13, 'campaign', c));
    edges.push(smEdge(c.client_id, c.id, cc, 0.9));
  });

  leads.forEach(l => {
    const lc = STAGE_COLORS[l.stage] || '#888';
    nodes.push(smNode(l.id, '', lc, 7, 'lead', l));
    edges.push(smEdge(l.campaign_id, l.id, lc, 0.4));
  });

  enrollments.forEach(e => {
    const ec = OUTCOME_COLORS[e.outcome] || '#888';
    const src = e.lead_id || e.client_id;
    const n = smNode(e.id, '', ec, e.outcome === 'enrolled' ? 10 : 7, 'enrollment', e,
      e.outcome === 'enrolled' ? { shape: 'star' } : {});
    nodes.push(n);
    if (src) edges.push(smEdge(src, e.id, ec, 0.35));
  });

  return { nodes, edges };
}

function buildJourneyData(leads) {
  const STAGE_X = { new: -300, contacted: -100, qualified: 100, follow_up: 300 };
  const nodes = [], edges = [];

  Object.entries(STAGE_X).forEach(([stage, x]) => {
    const sc = STAGE_COLORS[stage];
    nodes.push({
      id: `stage_${stage}`,
      label: stage.replace('_', ' ').toUpperCase(),
      color: { background: sc + '22', border: sc, highlight: { background: sc + '55', border: sc } },
      size: 18, shape: 'box',
      font: { size: 10, color: sc, bold: true, face: 'Inter, sans-serif' },
      x, y: -220, fixed: { x: true, y: true },
      shadow: { enabled: true, color: sc + '44', size: 20, x: 0, y: 0 },
      borderWidth: 1.5,
      _type: 'stage_header',
    });
  });

  leads.forEach(l => {
    const lc = STAGE_COLORS[l.stage] || '#888';
    nodes.push(smNode(l.id, l.student_name, lc, 9, 'lead', l, { x: STAGE_X[l.stage] || 0, fixed: { x: true } }));
    edges.push(smEdge(`stage_${l.stage}`, l.id, lc, 0.15, true));
  });

  return { nodes, edges };
}

function buildBlockerData(clients, escalations, byClient) {
  const nodes = [], edges = [];

  clients.forEach((c, i) => {
    const hc = HEALTH_COLORS[c.health] || HEALTH_COLORS[c.status] || '#888';
    const openEsc = (byClient[c.id] || {}).open_escalations || 0;
    nodes.push(smNode(c.id, c.name, hc, 20 + openEsc * 4, 'client', c));
  });

  escalations.forEach(e => {
    const ec = e.severity === 'high' ? '#c45c5c' : '#c4935c';
    nodes.push(smNode(e.id, '!', ec, 12, 'escalation', e));
    edges.push(smEdge(e.client_id, e.id, ec, 0.7));
  });

  clients.filter(c => c.status === 'onboarding').forEach(c => {
    ['lead_form_webhook', 'automation_rules', 'integrations'].forEach(b => {
      if (!c[b]) {
        const bid = `block_${c.id}_${b}`;
        nodes.push(smNode(bid, b.replace(/_/g, ' '), '#c45c5c', 9, 'blocker', null));
        edges.push(smEdge(c.id, bid, '#c45c5c', 0.5, true));
      }
    });
  });

  return { nodes, edges };
}

function smEdge(from, to, color, opacity = 0.3, dashes = false) {
  return {
    from, to, dashes,
    color: { color: color + Math.round(opacity * 255).toString(16).padStart(2, '0'), highlight: color + 'cc', hover: color + 'aa' },
    width: 0.8,
    arrows: { to: { enabled: true, scaleFactor: 0.3 } },
    smooth: { type: 'continuous', roundness: 0.2 },
    selectionWidth: 2,
    hoverWidth: 1.5,
  };
}

function smGetViewData(view, data) {
  const { clients = [], campaigns = [], leads = [], enrollments = [], escalations = [], byClient = {} } = data || {};
  if (view === 'funnel')   return buildFunnelData(clients, campaigns, leads, enrollments);
  if (view === 'journey')  return buildJourneyData(leads);
  if (view === 'blockers') return buildBlockerData(clients, escalations, byClient);
  return { nodes: [], edges: [] };
}

// Physics always on — high damping so it settles but still responds to drag
function smPhysicsOpts(view) {
  const base = {
    gravitationalConstant: -80,
    centralGravity: 0.008,
    springLength: 110,
    springConstant: 0.06,
    damping: 0.88,
    avoidOverlap: 1.0,
  };
  if (view === 'journey') Object.assign(base, {
    gravitationalConstant: -50, centralGravity: 0,
    springLength: 55, springConstant: 0.12, avoidOverlap: 0.6,
  });
  return {
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: base,
      stabilization: { iterations: 250, fit: true },
    }
  };
}

function smLegend(view) {
  if (view === 'funnel') return [
    { label: 'Client',           color: '#c45c5c' },
    { label: 'Campaign',         color: '#5c8ac4' },
    { label: 'Lead — New',       color: '#5cb8b8' },
    { label: 'Lead — Contacted', color: '#5c8ac4' },
    { label: 'Lead — Qualified', color: '#5cb87a' },
    { label: 'Lead — Follow-up', color: '#c4935c' },
    { label: 'Enrolled ★',       color: '#5cb87a' },
    { label: 'Lost',             color: '#c45c5c' },
  ];
  if (view === 'journey') return [
    { label: 'New',       color: '#5cb8b8' },
    { label: 'Contacted', color: '#5c8ac4' },
    { label: 'Qualified', color: '#5cb87a' },
    { label: 'Follow-up', color: '#c4935c' },
  ];
  return [
    { label: 'Healthy',    color: '#5cb87a' },
    { label: 'At Risk',    color: '#c45c5c' },
    { label: 'Stuck',      color: '#c4935c' },
    { label: 'Onboarding', color: '#5c8ac4' },
    { label: 'Escalation', color: '#c45c5c' },
    { label: 'Blocker',    color: '#c45c5c' },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────
window.StudioMapView = function StudioMapView() {
  const { useState, useEffect, useRef } = React;

  const { data: clients = [] }     = window.useClients     ? window.useClients()     : { data: [] };
  const { data: campaigns = [] }   = window.useCampaigns   ? window.useCampaigns()   : { data: [] };
  const { data: leads = [] }       = window.useLeads       ? window.useLeads()       : { data: [] };
  const { data: enrollments = [] } = window.useEnrollments ? window.useEnrollments() : { data: [] };
  const { data: escalations = [] } = window.useEscalations ? window.useEscalations() : { data: [] };
  const rollups = window.useRollups ? window.useRollups() : { byClient: {}, byCampaign: {} };

  const [activeView,    setActiveView]    = useState('funnel');
  const [nodeInfo,      setNodeInfo]      = useState(null);
  const [searchVal,     setSearchVal]     = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [showDrop,      setShowDrop]      = useState(false);
  const [statsText,     setStatsText]     = useState('');

  const graphRef   = useRef(null);
  const networkRef = useRef(null);
  const nodesDSRef = useRef(null);

  useEffect(() => {
    if (!graphRef.current || !window.vis) return;

    const { nodes, edges } = smGetViewData(activeView, { clients, campaigns, leads, enrollments, escalations, byClient: rollups.byClient });
    const nDS = new vis.DataSet(nodes);
    const eDS = new vis.DataSet(edges);
    nodesDSRef.current = nDS;

    const network = new vis.Network(graphRef.current, { nodes: nDS, edges: eDS }, {
      ...smPhysicsOpts(activeView),
      background: { color: GRAPH_BG },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        hideEdgesOnDrag: false,
        navigationButtons: false,
        keyboard: false,
        selectConnectedEdges: true,
        hoverConnectedEdges: true,
      },
      nodes: { shape: 'dot', borderWidth: 1.5, chosen: true },
      edges: { smooth: { type: 'continuous', roundness: 0.2 } },
    });

    networkRef.current = network;
    setStatsText(`${nodes.length} nodes · ${edges.length} edges`);
    setNodeInfo(null);
    setSearchVal('');
    setShowDrop(false);

    // After stabilization: leave physics enabled so dragging feels alive
    // Just stop the fitting so it doesn't re-animate unsolicited
    network.once('stabilizationIterationsDone', () => {
      network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
    });

    network.on('hoverNode', () => { graphRef.current.style.cursor = 'grab'; });
    network.on('blurNode',  () => { graphRef.current.style.cursor = 'default'; });
    network.on('dragStart', () => { graphRef.current.style.cursor = 'grabbing'; });
    network.on('dragEnd',   () => { graphRef.current.style.cursor = 'grab'; });
    network.on('click', p => {
      if (p.nodes.length > 0) setNodeInfo(nDS.get(p.nodes[0]));
      else setNodeInfo(null);
    });

    return () => { network.destroy(); networkRef.current = null; nodesDSRef.current = null; };
  }, [activeView, clients.length, campaigns.length, leads.length, enrollments.length, escalations.length]);

  function focusNode(nodeId) {
    if (!networkRef.current || !nodesDSRef.current) return;
    networkRef.current.focus(nodeId, { scale: 1.6, animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    networkRef.current.selectNodes([nodeId]);
    setNodeInfo(nodesDSRef.current.get(nodeId));
    setSearchVal('');
    setShowDrop(false);
  }

  function handleSearch(q) {
    setSearchVal(q);
    if (!q.trim() || !nodesDSRef.current) { setShowDrop(false); return; }
    const matches = nodesDSRef.current.get()
      .filter(n => n.label && n.label.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 15);
    setSearchMatches(matches);
    setShowDrop(matches.length > 0);
  }

  function NodeInfoPanel() {
    if (!nodeInfo) return (
      <span style={{ color: TEXT_DIM, fontStyle: 'italic', fontSize: 13 }}>Click a node to inspect</span>
    );
    const t = nodeInfo._type;
    const d = nodeInfo._raw || {};
    let rows = [];

    if (t === 'client') { const cr = rollups.byClient[d.id] || window.EMPTY_CLIENT_ROLLUP || {}; rows = [
      ['Name', d.name], ['Location', `${d.city || ''}${d.state ? ', ' + d.state : ''}`],
      ['Status', d.status], ['Health', d.health || '—'],
      ['Leads 30d', cr.leads_30d], ['Enrolled 30d', cr.enrollments_30d],
      ['MRR', d.mrr_cents ? '$' + (d.mrr_cents / 100).toLocaleString() : '—'],
    ]; }
    else if (t === 'campaign') { const cr = rollups.byCampaign[d.id] || window.EMPTY_CAMPAIGN_ROLLUP || {}; rows = [
      ['Program', d.program], ['Client', d.client_name],
      ['Status', d.status], ['Leads', cr.leads],
      ['Enrolled', cr.enrolled],
    ]; }
    else if (t === 'lead') rows = [
      ['Student', d.student_name], ['Parent', d.parent_name],
      ['Program', d.program], ['Stage', (d.stage || '').replace('_', ' ')],
      ['Days in stage', d.days_in_stage], ['Client', d.client_name],
    ];
    else if (t === 'enrollment') rows = [
      ['Student', d.student_name], ['Program', d.program],
      ['Outcome', (d.outcome || '').replace('_', ' ')],
      ...(d.weekly_rate_cents ? [['Rate', '$' + (d.weekly_rate_cents / 100) + '/wk']] : []),
      ...(d.enrolled_at ? [['Enrolled', d.enrolled_at]] : []),
    ];
    else if (t === 'escalation') rows = [
      ['Client', d.client_name], ['Severity', d.severity],
      ['Status', d.status], ['Reason', d.reason],
    ];
    else if (t === 'blocker') rows = [
      ['Missing setup', (nodeInfo.id || '').replace('block_', '').replace(/_/g, ' ')]
    ];

    return rows.map(([k, v]) => (
      <div key={k} style={{ marginBottom: 6, fontSize: 13, lineHeight: 1.4 }}>
        <span style={{ color: TEXT_DIM }}>{k}: </span>
        <span style={{ color: TEXT_MAIN }}>{String(v ?? '—')}</span>
      </div>
    ));
  }

  const VIEWS = [
    { id: 'funnel',   label: 'Funnel' },
    { id: 'journey',  label: 'Journey' },
    { id: 'blockers', label: 'Blockers' },
  ];

  const S = {
    outer:   { display: 'flex', height: '100%', overflow: 'hidden', background: GRAPH_BG },
    sidebar: {
      width: 240, flexShrink: 0,
      background: SIDEBAR_BG,
      borderLeft: `1px solid ${BORDER_CLR}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    section:  { borderBottom: `1px solid ${BORDER_CLR}`, padding: '10px 12px' },
    secLabel: { fontSize: 11, fontWeight: 600, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  };

  function tabStyle(active) {
    return {
      flex: 1, padding: '5px 4px', fontSize: 12, fontWeight: 500,
      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
      color: active ? TEXT_MAIN : TEXT_DIM,
      border: `1px solid ${active ? 'rgba(255,255,255,0.15)' : BORDER_CLR}`,
      borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
    };
  }

  return (
    <div style={S.outer}>
      {/* Graph canvas */}
      <div ref={graphRef} style={{ flex: 1, height: '100%' }} />

      {/* Sidebar */}
      <div style={S.sidebar}>

        {/* View tabs */}
        <div style={{ ...S.section, display: 'flex', gap: 4 }}>
          {VIEWS.map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)} style={tabStyle(activeView === tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ ...S.section, position: 'relative' }}>
          <input
            value={searchVal}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchVal && setShowDrop(true)}
            placeholder="Search nodes…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER_CLR}`,
              color: TEXT_MAIN, padding: '6px 10px',
              borderRadius: 4, fontSize: 13, outline: 'none',
            }}
          />
          {showDrop && (
            <div style={{
              position: 'absolute', top: '100%', left: 12, right: 12,
              background: '#161616', border: `1px solid ${BORDER_CLR}`,
              borderRadius: 4, zIndex: 10, maxHeight: 160, overflowY: 'auto',
            }}>
              {searchMatches.map(n => (
                <div key={n.id} onClick={() => focusNode(n.id)}
                  style={{
                    padding: '5px 10px', fontSize: 13, cursor: 'pointer',
                    borderLeft: `2px solid ${n.color?.border || '#888'}`,
                    color: TEXT_MAIN,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >{n.label}</div>
              ))}
            </div>
          )}
        </div>

        {/* Node info */}
        <div style={{ ...S.section, minHeight: 100 }}>
          <div style={S.secLabel}>Node Info</div>
          <NodeInfoPanel />
        </div>

        {/* Legend */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          <div style={S.secLabel}>Legend</div>
          {smLegend(activeView).map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.color + '44',
                border: `1.5px solid ${item.color}`,
                boxShadow: `0 0 6px ${item.color}66`,
                flexShrink: 0,
              }} />
              <span style={{ color: TEXT_MID }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${BORDER_CLR}`, fontSize: 12, color: TEXT_DIM }}>
          {statsText}
        </div>
      </div>
    </div>
  );
};
