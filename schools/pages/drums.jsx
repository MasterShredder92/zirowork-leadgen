function DrumsPage({ school, intakeUrl }) {
  const Layout = window.LandingLayout;
  const accent = school.accent || '#E04D27';

  const PAIN = [
    { icon: '🔊', title: 'Worried about the noise', body: "It's the #1 concern. We practice at the studio — no drum set required at home. Electronic kits for home practice are also an option and practically silent." },
    { icon: '💰', title: "Isn't a drum set really expensive?", body: 'You can start lessons without owning a kit. When you are ready, we can guide you to a solid beginner setup for $200–$300 that will last for years.' },
    { icon: '🤷', title: "Not sure if it's worth the commitment", body: 'Try one free lesson first. Most students who try drums once are hooked — there is nothing quite like playing a beat that locks in for the first time.' },
  ];

  const BENEFITS = [
    'Develop rhythm and timing that transfers to all music',
    'Full-body coordination and motor skill development',
    'A powerful outlet for energy and stress',
    'Build confidence through performance',
    'Learn any genre — rock, hip-hop, jazz, Latin',
    'No kit needed to start — practice here first',
  ];

  const FAQS = [
    { q: 'Do I need a drum set at home?', a: "Not to start. Practice happens here during your lesson. When the time is right, we'll help you choose a starter kit — acoustic or electronic." },
    { q: 'What age can kids start drums?', a: 'Most kids are ready around age 6–7. We assess coordination and focus individually. Motivated older beginners and adults are always welcome.' },
    { q: 'Will my neighbors hate me?', a: "If practicing at home, an electronic kit is nearly silent and perfect for apartments or shared walls. We'll help you figure out the best setup for your situation." },
    { q: 'How long until I can play a real beat?', a: 'Most students are playing a solid basic beat by the end of their first lesson. The first song usually happens within 3–6 lessons.' },
  ];

  return (
    <Layout school={school} intakeUrl={intakeUrl} instrument="drums">

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a0f0a 0%, #2e1e0d 50%, #1a1005 100%)', color: '#fff', padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: accent + '33', color: accent, padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
            {school.name}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Drum Lessons in {school.city || 'Your City'}<br />for All Ages & Levels
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 19px)', color: 'rgba(255,255,255,0.72)', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            Drums are the engine of every band. {school.name} offers one-on-one drum lessons for beginners and advancing players — no kit required to start.
          </p>
          <a href={intakeUrl} style={{ display: 'inline-block', padding: '16px 40px', background: accent, color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', letterSpacing: '-0.01em' }}>
            Book a Free Trial Lesson →
          </a>
          {school.offer && (
            <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>✓ {school.offer}</div>
          )}
        </div>
      </section>

      {/* Pain Points */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            The questions every new drummer has.
          </h2>
          <p style={{ textAlign: 'center', fontSize: 15, color: '#888', margin: '0 0 52px' }}>We have real answers.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {PAIN.map((p, i) => (
              <div key={i} style={{ padding: '28px 24px', background: '#f8f8f6', borderRadius: 14, borderLeft: `3px solid ${accent}` }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#1a1a1a', lineHeight: 1.3 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: '#666', lineHeight: 1.75 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Widget */}
      <section style={{ padding: '80px 24px', background: '#f8f8f6' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Hit the kit right now
          </h2>
          <p style={{ fontSize: 15, color: '#888', margin: '0 0 40px' }}>
            Tap the pads to hear the sounds. Kick, snare, hi-hat — the core of every beat you've ever heard.
          </p>
          <DrumsWidget accent={accent} />
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Why drummers train at {school.name}
            </h2>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>Rhythm is the foundation of all music.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BENEFITS.map((b, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#333' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: 'linear-gradient(135deg, ' + accent + '18, ' + accent + '2e)', borderRadius: 20, padding: '44px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🥁</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.01em' }}>
              Feel the beat.
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              First lesson is free. No drum set required. Just show up.
            </div>
            <a href={intakeUrl} style={{ display: 'inline-block', padding: '13px 30px', background: accent, color: '#fff', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Claim Your Free Trial →
            </a>
          </div>
        </div>
      </section>

      {/* Our Story */}
      {school.about && (
        <section style={{ padding: '80px 24px', background: '#f8f8f6' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em' }}>Our Story</h2>
            <p style={{ fontSize: 16, color: '#444', lineHeight: 1.85, margin: 0 }}>{school.about}</p>
            {school.directorName && (
              <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: '#888' }}>— {school.directorName}, {school.name}</div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {school.testimonials?.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#1a1a1a' }}>
          <div style={{ maxWidth: 1060, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 52px', letterSpacing: '-0.02em', color: '#fff' }}>
              What students are saying
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {school.testimonials.slice(0, 3).map((t, i) => (
                <div key={i} style={{ padding: '28px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div style={{ fontSize: 28, color: accent, lineHeight: 1, marginBottom: 12 }}>"</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75 }}>
                    {typeof t === 'string' ? t : (t.text || t.quote || '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 52px', letterSpacing: '-0.02em' }}>
            Common questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ padding: '20px 24px', background: '#f8f8f6', borderRadius: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1a1a1a' }}>{f.q}</div>
                <div style={{ fontSize: 14, color: '#555', lineHeight: 1.75 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '88px 24px', background: accent, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.15 }}>
            Your first drum lesson is free.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)', margin: '0 0 40px', lineHeight: 1.65 }}>
            No kit needed. No experience needed. Just bring the energy.
          </p>
          <a href={intakeUrl} style={{ display: 'inline-block', padding: '16px 44px', background: '#fff', color: accent, borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Book My Free Lesson →
          </a>
          <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {school.phone && <span>{school.phone}</span>}
            {school.phone && school.city && <span> · </span>}
            {school.city && <span>{school.city}{school.state ? ', ' + school.state : ''}</span>}
          </div>
        </div>
      </section>

    </Layout>
  );
}
window.DrumsPage = DrumsPage;
