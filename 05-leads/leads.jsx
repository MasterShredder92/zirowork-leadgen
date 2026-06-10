// 05-leads — Who is in the pipeline and what is the next move?
function LeadsView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState, useEffect } = React;
  const [clientId, setClientId] = useState(null);
  const leadsData = useLeads(clientId ? { client_id: clientId } : undefined).data || [];
  const clients = useClients().data || [];
  const [items, setItems] = useState(leadsData);
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  useEffect(() => { setItems(leadsData); }, [leadsData.length]);

  const STAGES = [
    { id: 'new',       label: 'New',       color: '#818CF8' },
    { id: 'contacted', label: 'Contacted', color: '#60A5FA' },
    { id: 'qualified', label: 'Qualified', color: '#38BDF8' },
    { id: 'follow_up', label: 'Follow-Up', color: '#F59E0B' },
    { id: 'enrolled',  label: 'Enrolled',  color: '#22C55E' },
    { id: 'lost',      label: 'Lost',      color: '#EF4444' },
  ];

  const STAGE_IDS = ['new', 'contacted', 'qualified', 'follow_up', 'enrolled'];

  const handleAdvance = async (lead, e) => {
    e.stopPropagation();
    const idx = STAGE_IDS.indexOf(lead.stage);
    if (idx === -1 || idx >= STAGE_IDS.length - 1) return;
    const nextStage = STAGE_IDS[idx + 1];
    setItems(prev => prev.map(l => l.id === lead.id ? { ...l, stage: nextStage, days_in_stage: 0 } : l));
    if (selectedLead && selectedLead.id === lead.id) setSelectedLead(prev => ({ ...prev, stage: nextStage }));
    if (window.sb) {
      await window.sb.from('leads').update({ stage: nextStage, days_in_stage: 0, stage_entered_at: new Date().toISOString() }).eq('id', lead.id);
    }
  };

  const handleMoveStage = async (newStage) => {
    if (!selectedLead) return;
    setItems(prev => prev.map(l => l.id === selectedLead.id ? { ...l, stage: newStage, days_in_stage: 0 } : l));
    setSelectedLead(prev => ({ ...prev, stage: newStage }));
    if (window.sb) {
      await window.sb.from('leads').update({ stage: newStage, days_in_stage: 0, stage_entered_at: new Date().toISOString() }).eq('id', selectedLead.id);
    }
  };

  const handleMarkEnrolled = async () => {
    if (!selectedLead) return;
    setItems(prev => prev.map(l => l.id === selectedLead.id ? { ...l, stage: 'enrolled', days_in_stage: 0 } : l));
    setSelectedLead(prev => ({ ...prev, stage: 'enrolled' }));
    if (window.sb) {
      await window.sb.from('leads').update({ stage: 'enrolled', days_in_stage: 0, stage_entered_at: new Date().toISOString() }).eq('id', selectedLead.id);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedLead || !noteText.trim()) return;
    setNoteSaving(true);
    const updated = noteText.trim();
    setItems(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: updated } : l));
    setSelectedLead(prev => ({ ...prev, notes: updated }));
    if (window.sb) {
      await window.sb.from('leads').update({ notes: updated }).eq('id', selectedLead.id);
    }
    setNoteText('');
    setNoteSaving(false);
  };

  const openDetail = (lead) => {
    setSelectedLead(lead);
    setNoteText('');
  };

  const byStage = id => items.filter(l => l.stage === id);

  const programColor = p => ({ Piano: '#818CF8', Guitar: '#F59E0B', Voice: '#EC4899', Drums: '#F97316' }[p] || '#6B7280');

  const stale = days => days >= 5;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Leads</h1>
            <div style={{ fontSize: 12, color: T.t3 }}>Who is in the pipeline and what is the next move?</div>
          </div>
          <select
            value={clientId || ''}
            onChange={e => setClientId(e.target.value || null)}
            style={{ fontSize: 13, color: T.t2, background: T.cardBg || 'var(--surface)', border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}>
            <option value=''>All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: 380, height: '100%',
          background: T.cardBg || 'var(--surface)', borderLeft: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', zIndex: 200, overflowY: 'auto',
        }}>
          {/* Panel header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>{selectedLead.student_name || selectedLead.parent_name}</div>
            <button onClick={() => setSelectedLead(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.t3, fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* Fields */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            {[
              ['Parent', selectedLead.parent_name],
              ['Student', selectedLead.student_name],
              ['Phone', selectedLead.phone],
              ['Email', selectedLead.email],
              ['Instrument', selectedLead.program],
              ['Age', selectedLead.age],
              ['Source', selectedLead.source],
              ['UTM Source', selectedLead.utm && selectedLead.utm.utm_source],
              ['UTM Medium', selectedLead.utm && selectedLead.utm.utm_medium],
              ['UTM Campaign', selectedLead.utm && selectedLead.utm.utm_campaign],
              ['Priority', selectedLead.priority],
              ['Score', selectedLead.score],
            ].filter(([, v]) => v != null && v !== '').map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.t4, width: 90, flexShrink: 0, paddingTop: 2 }}>{label}</span>
                <span style={{ fontSize: 12, color: T.t1 }}>{String(value)}</span>
              </div>
            ))}
            {/* Stage badge */}
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: T.t4, width: 90, flexShrink: 0, paddingTop: 2 }}>Stage</span>
              {(() => {
                const s = STAGES.find(x => x.id === selectedLead.stage);
                return <span style={{ fontSize: 11, fontWeight: 600, color: s ? s.color : T.t2, background: s ? s.color + '1A' : 'transparent', padding: '2px 8px', borderRadius: 20 }}>{s ? s.label : selectedLead.stage}</span>;
              })()}
            </div>
            {/* Notes */}
            {selectedLead.notes && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.t4, width: 90, flexShrink: 0, paddingTop: 2 }}>Notes</span>
                <span style={{ fontSize: 12, color: T.t2, fontStyle: 'italic' }}>{selectedLead.notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <div style={{ height: 1, background: T.border, margin: '4px 0' }} />

            {/* Move stage */}
            <div>
              <div style={{ fontSize: 11, color: T.t4, marginBottom: 6 }}>Move Stage</div>
              <select
                value={selectedLead.stage}
                onChange={e => handleMoveStage(e.target.value)}
                style={{ width: '100%', fontSize: 12, color: T.t2, background: T.bg || 'var(--bg)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {/* Mark enrolled */}
            {selectedLead.stage !== 'enrolled' && (
              <button
                onClick={handleMarkEnrolled}
                style={{ width: '100%', fontSize: 12, fontWeight: 600, color: '#fff', background: '#22C55E', border: 'none', borderRadius: 7, padding: '8px 0', cursor: 'pointer' }}>
                Mark Enrolled
              </button>
            )}

            {/* Add note */}
            <div>
              <div style={{ fontSize: 11, color: T.t4, marginBottom: 6 }}>Add Note</div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                placeholder='Type a note…'
                style={{ width: '100%', fontSize: 12, color: T.t1, background: T.bg || 'var(--bg)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button
                onClick={handleSaveNote}
                disabled={noteSaving || !noteText.trim()}
                style={{ marginTop: 6, width: '100%', fontSize: 12, fontWeight: 600, color: T.t1, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 0', cursor: noteText.trim() ? 'pointer' : 'default', opacity: noteText.trim() ? 1 : 0.4 }}>
                {noteSaving ? 'Saving…' : 'Save Note'}
              </button>
            </div>

            {/* View conversation */}
            <button
              onClick={() => { setSelectedLead(null); onNavigate && onNavigate('conversations'); }}
              style={{ width: '100%', fontSize: 12, fontWeight: 600, color: '#818CF8', background: 'transparent', border: `1px solid #818CF8`, borderRadius: 7, padding: '8px 0', cursor: 'pointer' }}>
              View Conversation →
            </button>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div style={{ flex: 1, overflowX: 'auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 24, height: '100%', minWidth: STAGES.length * 240 }}>
          {STAGES.map(stage => {
            const cols = byStage(stage.id);
            return (
              <div key={stage.id} style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, marginBottom: 4, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stage.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: T.t4, fontVariantNumeric: 'tabular-nums' }}>{cols.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  {cols.map(lead => (
                    <div key={lead.id} style={{
                      padding: '12px 8px', margin: '0 -8px', borderBottom: `1px solid ${T.border}`,
                      cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s',
                    }}
                      onClick={() => openDetail(lead)}
                      onMouseEnter={e => e.currentTarget.style.background = T.hover || (T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.t1, marginBottom: 4 }}>{lead.parent_name}</div>
                      <div style={{ fontSize: 11, color: T.t3, marginBottom: 8 }}>{lead.student_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: programColor(lead.program), background: programColor(lead.program) + '1A', padding: '2px 7px', borderRadius: 20 }}>
                          {lead.program}
                        </span>
                        <span style={{ fontSize: 10, color: T.t4, marginLeft: 'auto' }}>{lead.client_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                        {stale(lead.days_in_stage) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#F59E0B' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B' }} />
                            {lead.days_in_stage}d in stage
                          </div>
                        )}
                        {STAGE_IDS.indexOf(lead.stage) !== -1 && STAGE_IDS.indexOf(lead.stage) < STAGE_IDS.length - 1 && (
                          <button
                            onClick={e => handleAdvance(lead, e)}
                            style={{ marginLeft: 'auto', fontSize: 10, color: T.t3, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, lineHeight: 1 }}
                            onMouseEnter={e => e.currentTarget.style.color = stage.color}
                            onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                            → Next
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: T.t4 }}>Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.LeadsView = LeadsView;
