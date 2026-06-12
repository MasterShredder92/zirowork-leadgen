window.PortalPipeline = function PortalPipeline({ tenantId }) {
  const [stages, setStages] = React.useState(null);
  const [enrolled, setEnrolled] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      // Design-preview path: render the funnel fully without a backend.
      if (tenantId === 'preview') {
        setEnrolled([
          { student_name: 'Ava Bennett', parent_name: 'Marcus Bennett', program: 'Piano',  enrolled_at: '2026-06-07' },
          { student_name: 'Leo Carter',  parent_name: null,             program: 'Guitar', enrolled_at: '2026-06-05' },
          { student_name: 'Mia Flores',  parent_name: null,             program: 'Vocals', enrolled_at: '2026-06-03' },
        ]);
        setStages([
          { key: 'new',      label: 'New Lead',     count: 12, desc: 'Contacted once, awaiting reply' },
          { key: 'follow',   label: 'Following Up', count: 8,  desc: 'Multi-touch, no reply yet' },
          { key: 'engaged',  label: 'Engaged',      count: 5,  desc: 'Responded to outreach' },
          { key: 'enrolled', label: 'Enrolled',     count: 3,  desc: 'Handed off to you' },
        ]);
        setLoading(false);
        return;
      }

      // Messages drive the early-funnel counts; enrollments drive the handoff.
      const [{ data: msgs }, { data: enr }] = await Promise.all([
        window.sb.from('ziro_message_log')
          .select('direction, recipient_phone, sent_at')
          .eq('tenant_id', tenantId),
        window.sb.from('enrollments')
          .select('student_name, parent_name, program, enrolled_at')
          .eq('client_id', tenantId)
          .not('handed_off_at', 'is', null)
          .order('enrolled_at', { ascending: false }),
      ]);

      const enrolledList = enr || [];
      setEnrolled(enrolledList);

      // Derive early-funnel stages from conversation patterns
      const phoneMap = {};
      for (const m of (msgs || [])) {
        if (!phoneMap[m.recipient_phone]) phoneMap[m.recipient_phone] = { out: 0, inn: 0 };
        if (m.direction === 'outbound') phoneMap[m.recipient_phone].out++;
        else phoneMap[m.recipient_phone].inn++;
      }

      const phones = Object.values(phoneMap);
      const newLeads   = phones.filter(p => p.out === 1 && p.inn === 0).length;
      const contacted  = phones.filter(p => p.out > 1  && p.inn === 0).length;
      const replied    = phones.filter(p => p.inn > 0).length;

      setStages([
        { key: 'new',      label: 'New Lead',   count: newLeads,  desc: 'Contacted once, awaiting reply' },
        { key: 'follow',   label: 'Following Up', count: contacted, desc: 'Multi-touch, no reply yet' },
        { key: 'engaged',  label: 'Engaged',    count: replied,   desc: 'Responded to outreach' },
        { key: 'enrolled', label: 'Enrolled',   count: enrolledList.length, desc: 'Handed off to you' },
      ]);
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const COLORS = {
    new:      { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', text: '#1E40AF' },
    follow:   { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', text: '#92400E' },
    engaged:  { bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E', text: '#15803D' },
    enrolled: { bg: '#FFF7ED', border: '#FED7AA', dot: '#C84520', text: '#7C2D12' },
  };

  const s = {
    page: { padding: '24px 28px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.2s ease' },
    heading: { fontSize: 23, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--t1)', marginBottom: 4 },
    sub: { fontSize: 14, color: 'var(--t3)', marginBottom: 32 },
    flow: { display: 'flex', alignItems: 'flex-start', gap: 0 },
    stageWrap: { display: 'flex', alignItems: 'flex-start' },
    stageCol: { width: 160, padding: '0 4px' },
    stageTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    dot: (key) => ({
      width: 9, height: 9, borderRadius: '50%',
      background: COLORS[key].dot, flexShrink: 0,
    }),
    stageLabel: {
      fontSize: 12, fontWeight: 700, color: 'var(--t3)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
    },
    count: (key) => ({
      fontSize: 31, fontWeight: 700, color: 'var(--t1)',
      letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 8,
      fontVariantNumeric: 'tabular-nums',
    }),
    desc: { fontSize: 12, color: 'var(--t3)', lineHeight: 1.4 },
    arrow: {
      width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--t4)', flexShrink: 0, paddingTop: 24,
    },
    note: {
      marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--border)',
      fontSize: 13, color: 'var(--t3)', lineHeight: 1.6,
    },
  };

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--t3)', fontSize: 14 }}>Loading pipeline…</div>
    </div>
  );

  if (!stages) return (
    <div style={s.page}>
      <div style={s.heading}>Pipeline</div>
      <div style={{ color: 'var(--t3)', fontSize: 14, marginTop: 8 }}>No leads yet.</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.heading}>Pipeline</div>
      <div style={s.sub}>Where your leads are right now</div>

      <div style={s.flow}>
        {stages.map((stage, i) => (
          <div key={stage.key} style={s.stageWrap}>
            <div style={s.stageCol}>
              <div style={s.stageTop}>
                <div style={s.dot(stage.key)} />
                <div style={s.stageLabel}>{stage.label}</div>
              </div>
              <div style={s.count(stage.key)}>{stage.count}</div>
              <div style={s.desc}>{stage.desc}</div>
            </div>
            {i < stages.length - 1 && (
              <div style={s.arrow}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {enrolled.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Enrolled — ready for you</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 14 }}>These students confirmed their spot. They're yours now.</div>
          <div>
            {enrolled.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{e.student_name || 'Student'}</div>
                  {e.parent_name && <div style={{ fontSize: 13, color: 'var(--t3)' }}>Parent: {e.parent_name}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>{e.program || '—'}</div>
                  {e.enrolled_at && <div style={{ fontSize: 12, color: 'var(--t4)' }}>Enrolled {new Date(e.enrolled_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.note}>
        ZiroWork works every lead on your behalf. You see stage counts — not conversations. Contact info is shared with you when a lead enrolls.
      </div>
    </div>
  );
};
