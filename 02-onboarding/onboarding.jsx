// 02-onboarding — What is missing before a client can launch?
function ClientOnboardingView({ onNavigate }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState } = React;
  const { data: clientsData, refetch: refetchClients } = useClients();
  const clients = clientsData || [];

  // `derived` items map to TEXT columns holding a real value (the SMS number, the webhook URL).
  // They are read-only here: checked = a value exists. Toggling them would clobber the real value
  // with a boolean — see 94-knowledge/data-ssot.md. The rest are boolean onboarding flags.
  const CHECKLIST = [
    { key: 'sms_number',        label: 'SMS number assigned',          derived: true },
    { key: 'lead_form_webhook', label: 'Lead form webhook configured', derived: true },
    { key: 'protected_slots',   label: 'Protected slots confirmed' },
    { key: 'brand_assets',      label: 'Brand assets uploaded' },
    { key: 'automation_rules',  label: 'Automation rules configured' },
    { key: 'integrations',      label: 'Integrations verified' },
  ];

  const [wizardOpen, setWizardOpen] = useState(false);
  const pending = clients.filter(c => c.status === 'onboarding');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: T.t1, letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Client Onboarding</h1>
          <div style={{ fontSize: 13, color: T.t3 }}>What is missing before a client can launch?</div>
        </div>
        <button onClick={() => setWizardOpen(true)} style={{ padding: '8px 16px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          + New Client
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {pending.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: T.t4, fontSize: 14 }}>No clients currently onboarding.</div>
        ) : (
          <div>
            {pending.map(client => {
              const done = CHECKLIST.filter(item => client[item.key]).length;
              const pct = Math.round((done / CHECKLIST.length) * 100);
              return (
                <div key={client.id} style={{ paddingTop: 24, paddingBottom: 28, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 2 }}>{client.name}</div>
                      <div style={{ fontSize: 13, color: T.t4 }}>{client.city}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 29, fontWeight: 700, color: pct === 100 ? '#22C55E' : T.accent, letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
                      <div style={{ fontSize: 12, color: T.t4 }}>{done}/{CHECKLIST.length} complete</div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: T.border, borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#22C55E' : T.accent, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    {CHECKLIST.map(item => {
                      const checked = !!client[item.key];
                      return (
                        <div key={item.key}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: checked ? T.t2 : T.t4, cursor: item.derived ? 'default' : 'pointer' }}
                          onClick={async () => {
                            if (item.derived || !window.sb) return;
                            await window.sb.from('clients').update({ [item.key]: !client[item.key] }).eq('id', client.id);
                            refetchClients();
                          }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: checked ? '#22C55E' : T.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {checked && L.Check && <L.Check size={10} color="#fff" strokeWidth={3} />}
                          </div>
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {wizardOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <OnboardForm
            standalone={false}
            onSuccess={() => refetchClients()}
            onCancel={() => setWizardOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

window.ClientOnboardingView = ClientOnboardingView;
