// 07-escalations — What should not be handled by automation?
function EscalationsView({ onNavigate }) {
  const T = window.T || {};
  const { useState, useEffect } = React;
  const [escalations, setEscalations] = useState([]);
  const [threads, setThreads] = useState({}); // { [escalation.id]: [msg, ...] }
  const [loadingThread, setLoadingThread] = useState({}); // { [escalation.id]: bool }
  const [expandedThread, setExpandedThread] = useState({}); // { [escalation.id]: bool }
  const [acting, setActing] = useState({}); // { [escalation.id]: 'resolve'|'forward' }

  useEffect(() => {
    if (!window.sb) return;
    window.sb
      .from('ziro_messaging_escalations')
      .select('*')
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setEscalations(data || []);
      });
  }, []);

  const loadThread = (esc) => {
    if (threads[esc.id] !== undefined) {
      setExpandedThread(prev => ({ ...prev, [esc.id]: !prev[esc.id] }));
      return;
    }
    if (!window.sb) return;
    setLoadingThread(prev => ({ ...prev, [esc.id]: true }));
    window.sb
      .from('ziro_message_log')
      .select('id, direction, message_body, sent_at, from_agent')
      .eq('recipient_phone', esc.contact_phone)
      .eq('tenant_id', esc.tenant_id)
      .order('sent_at', { ascending: true })
      .then(({ data, error }) => {
        setLoadingThread(prev => ({ ...prev, [esc.id]: false }));
        if (error) { console.error(error); return; }
        setThreads(prev => ({ ...prev, [esc.id]: data || [] }));
        setExpandedThread(prev => ({ ...prev, [esc.id]: true }));
      });
  };

  const resolveEscalation = (id) => {
    if (!window.sb) { setEscalations(prev => prev.filter(e => e.id !== id)); return; }
    setActing(prev => ({ ...prev, [id]: 'resolve' }));
    window.sb
      .from('ziro_messaging_escalations')
      .update({ resolved_at: new Date().toISOString(), resolved_by: 'operator' })
      .eq('id', id)
      .then(({ error }) => {
        setActing(prev => ({ ...prev, [id]: null }));
        if (error) { console.error(error); return; }
        setEscalations(prev => prev.filter(e => e.id !== id));
      });
  };

  const forwardToStudio = (esc) => {
    if (!window.sb) return;
    setActing(prev => ({ ...prev, [esc.id]: 'forward' }));
    // Get studio_phone from clients table using tenant_id
    window.sb
      .from('clients')
      .select('studio_phone, name')
      .eq('id', esc.tenant_id)
      .single()
      .then(({ data: client, error: clientErr }) => {
        if (clientErr) { console.error(clientErr); setActing(prev => ({ ...prev, [esc.id]: null })); return; }
        const body = `ESCALATION: ${esc.contact_name} needs attention. ${esc.trigger_reason}. Original message: ${esc.original_message}`;
        window.sb
          .from('ziro_message_log')
          .insert({
            tenant_id: esc.tenant_id,
            direction: 'outbound',
            recipient_phone: client.studio_phone,
            message_body: body,
            from_agent: 'OPERATOR_FORWARD',
            status: 'pending_send',
          })
          .then(({ error: insertErr }) => {
            setActing(prev => ({ ...prev, [esc.id]: null }));
            if (insertErr) { console.error(insertErr); return; }
            resolveEscalation(esc.id);
          });
      });
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px' }}>Escalations</div>
          {escalations.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', background: '#EF444418', padding: '3px 10px', borderRadius: 20 }}>
              {escalations.length} open
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: T.t3 }}>What should not be handled by automation?</div>
      </div>

      {/* Doctrine callout */}
      <div style={{ padding: '12px 16px', background: '#F59E0B0D', border: '1px solid #F59E0B30', borderRadius: 8, marginBottom: 24, fontSize: 12, color: T.t2, lineHeight: 1.5 }}>
        <strong style={{ color: '#F59E0B' }}>Escalation rule:</strong> AI handles new enrollment conversations only. Enrolled students, billing, refunds, angry parents, and cancellations are forwarded to the studio — not handled by ZiroWork.
      </div>

      {escalations.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: T.t4, fontSize: 13 }}>No open escalations.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {escalations.map(esc => (
            <div key={esc.id} style={{
              padding: '16px 20px', background: T.cardBg || 'var(--surface)',
              border: '1px solid #EF444440', borderLeft: '3px solid #EF4444',
              borderRadius: 9,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{esc.contact_name}</span>
                    <span style={{ fontSize: 11, color: T.t4 }}>{esc.contact_phone}</span>
                  </div>
                  <div style={{ fontSize: 13, color: T.t2, marginBottom: 4 }}>
                    <strong style={{ color: T.t1 }}>Reason:</strong> {esc.trigger_reason}
                  </div>
                  {esc.original_message && (
                    <div style={{ fontSize: 12, color: T.t3, marginBottom: 4 }}>
                      <strong>Original:</strong> {esc.original_message}
                    </div>
                  )}
                  {esc.ziro_response && (
                    <div style={{ fontSize: 12, color: T.t3, marginBottom: 4 }}>
                      <strong>Ziro replied:</strong> {esc.ziro_response}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: T.t4, marginTop: 4 }}>Opened {new Date(esc.created_at).toLocaleString()}</div>

                  {/* Thread toggle */}
                  <button
                    onClick={() => loadThread(esc)}
                    style={{ marginTop: 10, fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {loadingThread[esc.id] ? 'Loading thread…' : expandedThread[esc.id] ? 'Hide conversation' : 'Show conversation'}
                  </button>

                  {/* Inline conversation thread */}
                  {expandedThread[esc.id] && threads[esc.id] && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {threads[esc.id].length === 0 ? (
                        <div style={{ fontSize: 11, color: T.t4 }}>No messages found.</div>
                      ) : threads[esc.id].map(msg => (
                        <div key={msg.id} style={{
                          fontSize: 12, color: T.t2, padding: '6px 10px',
                          background: msg.direction === 'inbound' ? (T.bg || 'var(--bg)') : '#3B82F610',
                          borderRadius: 6, alignSelf: msg.direction === 'inbound' ? 'flex-start' : 'flex-end',
                          maxWidth: '85%',
                        }}>
                          <div style={{ fontSize: 10, color: T.t4, marginBottom: 2 }}>
                            {msg.direction === 'inbound' ? 'Lead' : (msg.from_agent || 'Ziro')} · {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}
                          </div>
                          {msg.message_body}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => forwardToStudio(esc)}
                    disabled={!!acting[esc.id]}
                    style={{ padding: '6px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: acting[esc.id] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: acting[esc.id] ? 0.6 : 1 }}
                  >
                    {acting[esc.id] === 'forward' ? 'Sending…' : 'Forward to Studio'}
                  </button>
                  <button
                    onClick={() => resolveEscalation(esc.id)}
                    disabled={!!acting[esc.id]}
                    style={{ padding: '6px 14px', background: 'transparent', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: acting[esc.id] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: acting[esc.id] ? 0.6 : 1 }}
                  >
                    {acting[esc.id] === 'resolve' ? 'Resolving…' : 'Resolve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.EscalationsView = EscalationsView;
