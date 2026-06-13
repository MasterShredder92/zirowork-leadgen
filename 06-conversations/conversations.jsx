// 06-conversations — What is being said, what has AI handled, and what needs review?
function ConversationsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState, useEffect, useRef } = React;

  const [threads, setThreads] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [takeover, setTakeover] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!window.sb) { setLoading(false); return; }
    window.sb
      .from('ziro_message_log')
      .select('id, tenant_id, direction, recipient_phone, recipient_name, message_body, sent_at, from_agent, status')
      .order('sent_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const map = {};
        data.forEach(row => {
          const key = row.recipient_phone + '|' + row.tenant_id;
          if (!map[key]) {
            map[key] = {
              key,
              phone: row.recipient_phone,
              tenant_id: row.tenant_id,
              name: row.recipient_name || row.recipient_phone,
              last_message: row.message_body,
              last_at: row.sent_at,
              unread: row.direction === 'inbound',
            };
          } else if (row.direction === 'inbound') {
            map[key].unread = true;
          }
        });
        setThreads(Object.values(map));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedPhone || !window.sb) return;
    setMessages([]);
    const [phone, tenant_id] = selectedPhone.split('|');
    window.sb
      .from('ziro_message_log')
      .select('id, direction, message_body, sent_at, from_agent')
      .eq('recipient_phone', phone)
      .eq('tenant_id', tenant_id)
      .order('sent_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });
  }, [selectedPhone]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function selectThread(t) {
    setSelectedPhone(t.key);
    setTakeover(false);
    setDraft('');
    setThreads(prev => prev.map(r => r.key === t.key ? { ...r, unread: false } : r));
  }

  async function handleTakeover() {
    if (!window.sb || !selectedPhone) return;
    const [phone, tenant_id] = selectedPhone.split('|');
    // Scope to this thread's tenant — leads.client_id === tenant_id — so we don't
    // pause follow-ups for a same-phone lead belonging to a different client.
    await window.sb.from('leads').update({ followup_paused: true }).eq('phone', phone).eq('client_id', tenant_id);
    setTakeover(true);
  }

  async function sendReply() {
    if (!draft.trim() || !selectedPhone || !window.sb) return;
    const [phone, tenant_id] = selectedPhone.split('|');
    const thread = threads.find(t => t.key === selectedPhone);
    setSending(true);
    const { data, error } = await window.sb.from('ziro_message_log').insert({
      tenant_id,
      channel: 'sms',
      direction: 'outbound',
      recipient_phone: phone,
      recipient_name: thread ? thread.name : null,
      message_body: draft.trim(),
      sent_at: new Date().toISOString(),
      from_agent: 'OPERATOR',
      status: 'sent',
    }).select().single();
    setSending(false);
    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setDraft('');
    }
  }

  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const selected = threads.find(t => t.key === selectedPhone);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Conversations</h1>
        <div style={{ fontSize: 13, color: T.t3 }}>What is being said, what has AI handled, and what needs review?</div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Thread list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${T.border}`, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 24, fontSize: 14, color: T.t4 }}>Loading…</div>
          )}
          {!loading && threads.length === 0 && (
            <div style={{ padding: 24, fontSize: 14, color: T.t4 }}>No messages yet.</div>
          )}
          {threads.map(t => (
            <div key={t.key}
              onClick={() => selectThread(t)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                borderBottom: `1px solid ${T.border}`,
                background: selectedPhone === t.key ? (T.rowSelected || 'rgba(99,102,241,0.08)') : 'transparent',
              }}
              onMouseEnter={e => { if (selectedPhone !== t.key) e.currentTarget.style.background = T.rowHover || 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (selectedPhone !== t.key) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />}
                  <span style={{ fontSize: 14, fontWeight: t.unread ? 600 : 500, color: T.t1 }}>{t.name}</span>
                </div>
                <span style={{ fontSize: 12, color: T.t4, whiteSpace: 'nowrap', marginLeft: 8 }}>{fmtTime(t.last_at)}</span>
              </div>
              <div style={{ fontSize: 13, color: T.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.last_message}
              </div>
            </div>
          ))}
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedPhone && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, color: T.t4 }}>Select a conversation</span>
            </div>
          )}

          {selectedPhone && (
            <>
              {/* Thread header */}
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.t1 }}>{selected ? selected.name : ''}</div>
                  <div style={{ fontSize: 12, color: T.t4 }}>{selected ? selected.phone : ''}</div>
                </div>
                {!takeover && (
                  <button onClick={handleTakeover}
                    style={{ fontSize: 13, fontWeight: 600, color: '#6366F1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Take Over
                  </button>
                )}
                {takeover && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '4px 10px' }}>
                    Manual Mode
                  </span>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(m => {
                  const out = m.direction === 'outbound';
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: out ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '9px 13px', borderRadius: out ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: out ? '#6366F1' : (T.card || '#1E1E2E'),
                        color: out ? '#fff' : T.t1,
                        fontSize: 14, lineHeight: 1.5,
                      }}>
                        {m.message_body}
                      </div>
                      <div style={{ fontSize: 11, color: T.t4, marginTop: 3 }}>
                        {out && m.from_agent ? m.from_agent + ' · ' : ''}{fmtTime(m.sent_at)}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose box — only visible after takeover */}
              {takeover && (
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Type a reply… (Enter to send)"
                    rows={2}
                    style={{
                      flex: 1, resize: 'none', padding: '8px 12px', borderRadius: 6,
                      border: `1px solid ${T.border}`, background: T.input || T.card || '#1E1E2E',
                      color: T.t1, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button onClick={sendReply} disabled={sending || !draft.trim()}
                    style={{
                      padding: '0 18px', borderRadius: 6, border: 'none', cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
                      background: '#6366F1', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                      opacity: sending || !draft.trim() ? 0.5 : 1,
                    }}>
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.ConversationsView = ConversationsView;
