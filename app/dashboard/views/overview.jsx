window.PortalOverview = function PortalOverview({ tenantId }) {
  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const { data: msgs } = await window.sb
        .from('ziro_message_log')
        .select('direction, recipient_phone, sent_at, status')
        .eq('tenant_id', tenantId)
        .order('sent_at', { ascending: false });

      if (!msgs) { setLoading(false); return; }

      const phones = new Set(msgs.map(m => m.recipient_phone));
      const outbound = msgs.filter(m => m.direction === 'outbound');
      const inbound  = msgs.filter(m => m.direction === 'inbound');
      const repliedPhones = new Set(inbound.map(m => m.recipient_phone));

      // 30-day window
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const recent = msgs.filter(m => m.sent_at >= cutoff);
      const recentPhones = new Set(recent.map(m => m.recipient_phone));

      const lastMsg = msgs[0];
      const lastActivity = lastMsg
        ? formatRelative(lastMsg.sent_at)
        : 'No activity yet';

      setMetrics({
        totalLeads: phones.size,
        contacted: outbound.length > 0 ? phones.size : 0,
        replied: repliedPhones.size,
        replyRate: phones.size > 0 ? Math.round((repliedPhones.size / phones.size) * 100) : 0,
        messagesSent: outbound.length,
        last30Days: recentPhones.size,
        lastActivity,
      });
      setLoading(false);
    }
    load();
  }, [tenantId]);

  function formatRelative(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const s = {
    page: { padding: '32px 36px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.2s ease' },
    heading: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--t1)', marginBottom: 4 },
    sub: { fontSize: 13, color: 'var(--t3)', marginBottom: 28 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 },
    card: {
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '20px 22px',
    },
    label: { fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 },
    value: { fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.5px' },
    valueSmall: { fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px' },
    badge: {
      display: 'inline-block', marginTop: 6,
      fontSize: 11, fontWeight: 600, color: 'var(--accent)',
      background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 20,
    },
    activityCard: {
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: 12,
    },
    dot: {
      width: 8, height: 8, borderRadius: '50%',
      background: '#10B981', flexShrink: 0,
      boxShadow: '0 0 0 3px rgba(16,185,129,0.15)',
    },
    activityText: { fontSize: 13, color: 'var(--t2)' },
    activityBold: { fontWeight: 600, color: 'var(--t1)' },
  };

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--t3)', fontSize: 13 }}>Loading your data…</div>
    </div>
  );

  if (!metrics) return (
    <div style={s.page}>
      <div style={s.heading}>Overview</div>
      <div style={{ color: 'var(--t3)', fontSize: 13, marginTop: 8 }}>No data yet. Leads will appear here once your campaign is live.</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.heading}>Overview</div>
      <div style={s.sub}>Your pipeline at a glance</div>

      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.label}>Total Leads</div>
          <div style={s.value}>{metrics.totalLeads}</div>
          <div style={s.badge}>{metrics.last30Days} last 30 days</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Replied</div>
          <div style={s.value}>{metrics.replied}</div>
          <div style={s.badge}>{metrics.replyRate}% response rate</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Messages Sent</div>
          <div style={s.value}>{metrics.messagesSent}</div>
          <div style={s.badge}>by ZiroWork</div>
        </div>
      </div>

      <div style={s.activityCard}>
        <div style={s.dot} />
        <div style={s.activityText}>
          System active —{' '}
          <span style={s.activityBold}>last outreach {metrics.lastActivity}</span>
        </div>
      </div>
    </div>
  );
};
