const { useState } = React;

const STEPS = [
  {
    id: 'welcome',
    eyebrow: "You're in.",
    title: (studio) => studio?.name || 'Your studio',
    body: "Your music school's operating system is ready. Manage students, families, leads, invoices, teachers, and payroll — all in one place.",
    cta: "See what's included",
  },
  {
    id: 'tour',
    eyebrow: 'Everything in one place.',
    title: () => 'Built for music schools.',
    body: null,
    cta: 'Open my studio',
    features: [
      { icon: 'Users',      label: 'Families & Students',  desc: 'Full CRM — enrollment status, lessons, notes, billing history.' },
      { icon: 'Zap',        label: 'Leads Pipeline',        desc: 'Track every inquiry from first contact to enrolled student.' },
      { icon: 'FileText',   label: 'Invoices',              desc: 'Create, send, and track payments for every family.' },
      { icon: 'GraduationCap', label: 'Teachers',           desc: 'Manage your roster, availability, and payroll.' },
    ],
  },
];

function OnboardingView({ studio, onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const next = () => isLast ? onComplete() : setStep(s => s + 1);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <img src="bolt-white.png" alt="ZiroWork" style={{ height: 28, opacity: 0.9 }} />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 44 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === step ? 24 : 6,
              background: i === step ? 'var(--accent)' : 'var(--border-med)',
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        {/* Copy */}
        <div style={{ textAlign: 'center', marginBottom: current.features ? 32 : 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            {current.eyebrow}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 14 }}>
            {current.title(studio)}
          </div>
          {current.body && (
            <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.75, maxWidth: 360, margin: '0 auto' }}>
              {current.body}
            </div>
          )}
        </div>

        {/* Feature list */}
        {current.features && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {current.features.map(f => {
              const Icon = window.LucideReact?.[f.icon];
              return (
                <div key={f.label} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(224,77,39,0.10)',
                  }}>
                    {Icon && <Icon size={16} strokeWidth={1.75} color="var(--accent)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <button onClick={next} style={{
          width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600,
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {current.cta}
        </button>

        {/* Skip */}
        {!isLast && (
          <div onClick={onComplete} style={{
            textAlign: 'center', marginTop: 14,
            fontSize: 12, color: 'var(--text-4)', cursor: 'pointer',
          }}>
            Skip
          </div>
        )}

      </div>
    </div>
  );
}

window.OnboardingView = OnboardingView;
