// 10-reporting — Why should each client keep paying ZiroWork?
function ReportingView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const clients = useClients().data || [];
  const leads = useLeads().data || [];
  const enrollments = useEnrollments().data || [];

  const live = clients.filter(c => c.status === 'live');

  // ── Real metrics from Supabase ──────────────────────────────
  // msgLog: all ziro_message_log rows needed for response time + rate
  // keyed as { phones: Set<string> of inbound phones, outboundByPhone: Map<phone, earliest sent_at> }
  const [msgMetrics, setMsgMetrics] = React.useState(null);
  const [msgLoading, setMsgLoading] = React.useState(true);

  React.useEffect(() => {
    if (!window.sb) {
      setMsgLoading(false);
      return;
    }
    // Fetch all message log rows in one shot (small dataset in Phase 1)
    window.sb
      .from('ziro_message_log')
      .select('direction, recipient_phone, sent_at, created_at')
      .then(({ data: rows }) => {
        if (!rows) { setMsgLoading(false); return; }
        // inbound: track distinct phones that replied
        const inboundPhones = new Set();
        // outbound: earliest sent_at per phone (first outbound message)
        const firstOutboundByPhone = {};
        rows.forEach(r => {
          const phone = r.recipient_phone;
          if (!phone) return;
          if (r.direction === 'inbound') {
            inboundPhones.add(phone);
          } else if (r.direction === 'outbound') {
            const ts = r.sent_at || r.created_at;
            if (ts && (!firstOutboundByPhone[phone] || ts < firstOutboundByPhone[phone])) {
              firstOutboundByPhone[phone] = ts;
            }
          }
        });
        setMsgMetrics({ inboundPhones, firstOutboundByPhone });
        setMsgLoading(false);
      });
  }, []);

  // ── Month boundary (JS, no date_trunc needed) ───────────────
  const monthStart = React.useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', marginBottom: 4 }}>Reporting</div>
        <div style={{ fontSize: 13, color: T.t3 }}>Why should each client keep paying ZiroWork?</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {live.map(client => {
          const mrr = client.mrr_cents ? '$' + (client.mrr_cents / 100).toFixed(0) + '/mo' : '—';

          // Leads this month (from already-fetched leads array)
          const clientLeads = leads.filter(l =>
            l.client_id === client.id && l.created_at >= monthStart
          ).length;

          // Enrollments this month
          const enrolled = enrollments.filter(e =>
            e.client_id === client.id &&
            e.outcome === 'enrolled' &&
            e.created_at >= monthStart
          ).length;

          // Revenue estimate: SUM(weekly_rate_cents * 4) for all active enrolled
          const activeEnrolled = enrollments.filter(e =>
            e.client_id === client.id && e.outcome === 'enrolled' && e.weekly_rate_cents
          );
          const revenueCents = activeEnrolled.reduce((sum, e) => sum + (e.weekly_rate_cents * 4), 0);
          const revenueStr = revenueCents > 0 ? '$' + (revenueCents / 100).toFixed(0) : null;

          // ROI multiple
          const roiMultiple = client.mrr_cents && revenueCents
            ? (revenueCents / client.mrr_cents).toFixed(1) + 'x'
            : (client.mrr_cents && enrolled
              ? ((enrolled * 12000) / client.mrr_cents).toFixed(1) + 'x'
              : '—');

          // Per-client metrics from message log
          let avgResp = msgLoading ? '…' : '—';
          let smsRespRate = msgLoading ? '…' : '—';

          if (!msgLoading && msgMetrics) {
            // phones for this client's leads
            const clientPhones = leads
              .filter(l => l.client_id === client.id && l.phone)
              .map(l => ({ phone: l.phone, created_at: l.created_at }));

            const totalLeads = clientPhones.length;

            // SMS response rate: inbound replies / total leads with phones
            if (totalLeads > 0) {
              const replied = clientPhones.filter(lp =>
                msgMetrics.inboundPhones.has(lp.phone)
              ).length;
              smsRespRate = Math.round((replied / totalLeads) * 100) + '%';
            }

            // Avg response time: avg(first_outbound_sent_at - lead.created_at) in seconds
            const responseTimes = clientPhones
              .filter(lp => msgMetrics.firstOutboundByPhone[lp.phone] && lp.created_at)
              .map(lp => {
                const diff = (new Date(msgMetrics.firstOutboundByPhone[lp.phone]) - new Date(lp.created_at)) / 1000;
                return diff;
              })
              .filter(diff => diff > 0);

            if (responseTimes.length > 0) {
              const avgSec = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
              avgResp = avgSec < 60 ? avgSec + 's' : Math.round(avgSec / 60) + 'm';
            }
          }

          return (
            <div key={client.id} style={{ padding: '20px 24px', background: T.cardBg || 'var(--surface)', border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 2 }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: T.t4 }}>{client.city}</div>
                </div>
                {L.ExternalLink && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.t4, padding: 4 }}>
                    <L.ExternalLink size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 8px', marginBottom: 16 }}>
                {[
                  { label: 'Leads (mo)', value: clientLeads },
                  { label: 'Avg Response', value: avgResp },
                  { label: 'Enrolled (mo)', value: enrolled },
                  { label: 'SMS Reply Rate', value: smsRespRate },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.t1 }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 12px', background: '#22C55E10', border: '1px solid #22C55E30', borderRadius: 7 }}>
                <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Revenue Generated</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#22C55E' }}>
                  {roiMultiple} ROI
                  {revenueStr && <span style={{ fontSize: 11, fontWeight: 400, color: T.t4, marginLeft: 6 }}>{revenueStr} est. monthly</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ReportingView = ReportingView;
