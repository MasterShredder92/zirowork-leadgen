function VocalsPage({ school, intakeUrl }) {
  const Layout = window.LandingLayout;
  const accent = school.accent || '#E04D27';

  const PAIN = [
    { icon: '😶', title: "I'm scared to sing in front of someone", body: "Everyone is. Our teachers have heard thousands of first-time singers, and the lesson room is the safest place to find your voice — judgment-free, always." },
    { icon: '🤷', title: "I don't know if I'm 'good enough'", body: "Good enough for what? For lessons, you just need a voice — and you already have one. Vocal training is about developing what you have, not requiring talent upfront." },
    { icon: '📺', title: "I've tried apps and YouTube but it's not working", body: 'Singing technique is highly personal. What works for one voice can hurt another. A trained teacher hears exactly what you need and guides you safely.' },
  ];

  const BENEFITS = [
    'Proper breath support and vocal technique',
    'Expand your range — higher highs, lower lows',
    'Eliminate tension and vocal strain',
    'Build real stage confidence and presence',
    'Flexible scheduling for all ages',
    'Learn songs from any genre you love',
  ];

  const FAQS = [
    { q: 'Do I need any singing experience?', a: "None whatsoever. Many of our best vocal students started convinced they can't sing. Your teacher will meet you exactly where you are." },
    { q: 'What age can kids start voice lessons?', a: "We typically recommend starting around age 7–8 when the voice is ready for structured training. We're always happy to assess younger students individually." },
    { q: 'Will lessons damage my voice?', a: 'Quite the opposite — proper training protects your voice. We focus on healthy technique from the very first lesson to prevent strain and injury.' },
    { q: 'Can I choose what songs I learn?', a: 'Yes. We believe you learn faster when you care about the music. We work from genres and artists you love while building technical skills underneath.' },
  ];

  return (
    <Layout school={school} intakeUrl={intakeUrl} instrument="vocals">

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1f0a1f 0%, #2d1635 50%, #1a0d2e 100%)', color: '#fff', padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: accent + '33', color: accent, padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
            {school.name}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Voice Lessons in {school.city || 'Your City'}<br />Find Your Sound
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 19px)', color: 'rgba(255,255,255,0.72)', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            Whether you want to sing in a band, perform at school, or just stop holding back in the shower — {school.name} offers voice lessons that build real confidence, for real singers.
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
            You want to sing. Here's what's holding you back.
          </h2>
          <p style={{ textAlign: 'center', fontSize: 15, color: '#888', margin: '0 0 52px' }}>We've heard every version of this. Here's how we help.</p>
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
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Record yourself right now
          </h2>
          <p style={{ fontSize: 15, color: '#888', margin: '0 0 40px' }}>
            Sing anything — a melody, a word, a hum. This is the first step every singer takes.
          </p>
          <VocalsWidget accent={accent} />
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              What you'll gain at {school.name}
            </h2>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>More than singing — it's about finding your voice.</p>
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
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎤</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.01em' }}>
              Your voice is already there.
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              First lesson is free. No experience needed. Just bring your voice.
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
            Your first voice lesson is free.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)', margin: '0 0 40px', lineHeight: 1.65 }}>
            No judgment, no commitment. Come in, sing something, and see what's possible.
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
window.VocalsPage = VocalsPage;
