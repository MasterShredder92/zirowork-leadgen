function ThankYouPage({ school, slug }) {
  const accent = school.accent || '#E04D27';
  const params = new URLSearchParams(window.location.search);
  const instrument = params.get('instrument') || 'music';
  const INST_LABEL = { piano: 'Piano', guitar: 'Guitar', vocals: 'Voice', drums: 'Drums', violin: 'Violin' };
  const instLabel = INST_LABEL[instrument] || instrument.charAt(0).toUpperCase() + instrument.slice(1);
  const backInstrument = instrument !== 'music' ? instrument : 'piano';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '40px 24px',
    }}>

      {/* School badge */}
      <div style={{
        display: 'inline-block',
        background: accent + '18',
        color: accent,
        padding: '3px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 32,
      }}>
        {school.name}
      </div>

      {/* Checkmark */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        boxShadow: '0 8px 32px rgba(34,197,94,0.25)',
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M8 18.5L15 25.5L28 11" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 42px)',
        fontWeight: 800,
        color: '#1a1a1a',
        letterSpacing: '-0.02em',
        margin: '0 0 12px',
        textAlign: 'center',
      }}>
        You're in!
      </h1>

      {/* Subheadline */}
      <p style={{
        fontSize: 19,
        color: '#555',
        margin: '0 0 12px',
        textAlign: 'center',
        lineHeight: 1.5,
        maxWidth: 400,
        fontWeight: 600,
      }}>
        Your {instLabel} lesson request has been received.
      </p>

      {/* Body */}
      <p style={{
        fontSize: 16,
        color: '#888',
        margin: '0 0 36px',
        textAlign: 'center',
        lineHeight: 1.7,
        maxWidth: 400,
      }}>
        We'll reach out within the hour during business hours to confirm your match and get your first lesson scheduled.
      </p>

      {/* Phone */}
      {school.phone && (
        <a
          href={'tel:' + school.phone.replace(/\D/g, '')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: '#f8f8f6',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            color: '#1a1a1a',
            textDecoration: 'none',
            marginBottom: 32,
            border: '1px solid #f0f0ee',
          }}
        >
          <span style={{ fontSize: 17 }}>📞</span>
          {school.phone}
        </a>
      )}

      {/* Back link */}
      <a
        href={'/schools/' + slug + '/' + backInstrument}
        style={{
          fontSize: 15,
          color: accent,
          fontWeight: 700,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← Back to {school.name}
      </a>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        fontSize: 13,
        color: '#ccc',
        textAlign: 'center',
      }}>
        {school.name}{school.city ? ' · ' + school.city : ''}
      </div>

    </div>
  );
}

window.ThankYouPage = ThankYouPage;
